// Calendar sync manager - handles syncing external calendar events

import { createAdminClient } from '@/lib/supabase/admin';
import { GoogleCalendarService } from './google-calendar';
import { OutlookCalendarService } from './outlook-calendar';
import type { CalendarIntegration, CalendarEvent } from '@/lib/types';

export class CalendarSyncManager {
  /**
   * Sync all enabled calendar integrations for a user
   */
  static async syncUserCalendars(userId: string): Promise<{
    success: boolean;
    syncedIntegrations: string[];
    errors: string[];
  }> {
    const supabase = createAdminClient();
    const results = {
      success: true,
      syncedIntegrations: [] as string[],
      errors: [] as string[],
    };

    try {
      // Get all enabled integrations for the user
      const { data: integrations, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('sync_enabled', true);

      if (error) {
        console.error('Error fetching integrations:', error);
        results.errors.push('Failed to fetch calendar integrations');
        return results;
      }

      if (!integrations || integrations.length === 0) {
        return results;
      }

      // Sync each integration
      for (const integration of integrations) {
        try {
          await this.syncIntegration(integration);
          results.syncedIntegrations.push(integration.id);
        } catch (error) {
          console.error(`Error syncing integration ${integration.id}:`, error);
          results.errors.push(`Failed to sync ${integration.provider} calendar: ${integration.calendar_name}`);
          results.success = false;
        }
      }

      return results;
    } catch (error) {
      console.error('Error in syncUserCalendars:', error);
      results.success = false;
      results.errors.push('Unexpected error during calendar sync');
      return results;
    }
  }

  /**
   * Sync a specific calendar integration
   */
  static async syncIntegration(integration: CalendarIntegration): Promise<void> {
    const supabase = createAdminClient();

    try {
      let calendarService: GoogleCalendarService | OutlookCalendarService;

      // Initialize the appropriate calendar service
      if (integration.provider === 'google') {
        calendarService = new GoogleCalendarService(
          integration.access_token,
          integration.refresh_token
        );
      } else if (integration.provider === 'outlook') {
        calendarService = new OutlookCalendarService(
          integration.access_token,
          integration.refresh_token
        );
      } else {
        throw new Error(`Unsupported calendar provider: ${integration.provider}`);
      }

      // Check if token needs refresh
      const refreshedTokens = await calendarService.refreshTokenIfNeeded();
      if (refreshedTokens) {
        // Update tokens in database
        await supabase
          .from('calendar_integrations')
          .update({
            access_token: refreshedTokens.access_token,
            refresh_token: refreshedTokens.refresh_token,
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);

        // Update local integration object
        integration.access_token = refreshedTokens.access_token;
        if (refreshedTokens.refresh_token) {
          integration.refresh_token = refreshedTokens.refresh_token;
        }
      }

      // Define sync date range (last 30 days to next 90 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      // Fetch events from external calendar
      const externalEvents = await calendarService.getEvents(
        integration.calendar_id,
        startDate,
        endDate
      );

      // Get existing events for this integration
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('external_event_id, id')
        .eq('integration_id', integration.id);

      const existingEventIds = new Set(
        existingEvents?.map(event => event.external_event_id) || []
      );

      // Process new/updated events
      const eventsToInsert: CalendarEvent[] = [];
      const eventsToUpdate: CalendarEvent[] = [];

      for (const event of externalEvents) {
        const isExisting = existingEventIds.has(event.external_event_id);
        
        const eventData = {
          integration_id: integration.id,
          external_event_id: event.external_event_id,
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          all_day: event.all_day,
          location: event.location,
          attendees: event.attendees,
          recurrence_rule: event.recurrence_rule,
          status: event.status,
          updated_at: new Date().toISOString(),
        };

        if (isExisting) {
          eventsToUpdate.push({
            ...eventData,
            created_at: new Date().toISOString(),
            id: event.id,
          });
        } else {
          eventsToInsert.push({
            ...eventData,
            created_at: new Date().toISOString(),
            id: event.id,
          });
        }
      }

      // Batch insert new events
      if (eventsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert(eventsToInsert);

        if (insertError) {
          console.error('Error inserting events:', insertError);
          throw new Error('Failed to insert new calendar events');
        }
      }

      // Update existing events
      if (eventsToUpdate.length > 0) {
        for (const eventData of eventsToUpdate) {
          const { error: updateError } = await supabase
            .from('calendar_events')
            .update(eventData)
            .eq('integration_id', integration.id)
            .eq('external_event_id', eventData.external_event_id);

          if (updateError) {
            console.error('Error updating event:', updateError);
            // Continue with other updates even if one fails
          }
        }
      }

      // Update last sync time
      await supabase
        .from('calendar_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

    } catch (error) {
      console.error('Error syncing integration:', error);
      throw error;
    }
  }

  /**
   * Get calendar conflicts for a specific time range
   */
  static async getCalendarConflicts(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<CalendarEvent[]> {
    const supabase = createAdminClient();

    try {
      const { data: conflicts, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          calendar_integrations!inner (
            user_id,
            provider,
            calendar_name
          )
        `)
        .eq('calendar_integrations.user_id', userId)
        .eq('calendar_integrations.sync_enabled', true)
        .eq('status', 'confirmed')
        .gte('start_time', startTime.toISOString())
        .lte('end_time', endTime.toISOString());

      if (error) {
        console.error('Error fetching calendar conflicts:', error);
        return [];
      }

      return conflicts || [];
    } catch (error) {
      console.error('Error in getCalendarConflicts:', error);
      return [];
    }
  }

  /**
   * Create a booking event in external calendars
   */
  static async createBookingEvent(
    userId: string,
    bookingData: {
      title: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      location?: string;
      attendees?: Array<{ email: string; name?: string }>;
    }
  ): Promise<{ success: boolean; createdEvents: string[]; errors: string[] }> {
    const supabase = createAdminClient();
    const results = {
      success: true,
      createdEvents: [] as string[],
      errors: [] as string[],
    };

    try {
      // Get all enabled integrations for the user
      const { data: integrations, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('sync_enabled', true);

      if (error || !integrations) {
        results.errors.push('Failed to fetch calendar integrations');
        results.success = false;
        return results;
      }

      // Create event in each enabled calendar
      for (const integration of integrations) {
        try {
          let calendarService: GoogleCalendarService | OutlookCalendarService;

          if (integration.provider === 'google') {
            calendarService = new GoogleCalendarService(
              integration.access_token,
              integration.refresh_token
            );
          } else if (integration.provider === 'outlook') {
            calendarService = new OutlookCalendarService(
              integration.access_token,
              integration.refresh_token
            );
          } else {
            continue; // Skip unsupported providers
          }

          // Check if token needs refresh
          const refreshedTokens = await calendarService.refreshTokenIfNeeded();
          if (refreshedTokens) {
            // Update tokens in database
            await supabase
              .from('calendar_integrations')
              .update({
                access_token: refreshedTokens.access_token,
                refresh_token: refreshedTokens.refresh_token,
                updated_at: new Date().toISOString(),
              })
              .eq('id', integration.id);

            // Update local integration object
            integration.access_token = refreshedTokens.access_token;
            if (refreshedTokens.refresh_token) {
              integration.refresh_token = refreshedTokens.refresh_token;
            }
          }

          // Create the event
          const createdEvent = await calendarService.createEvent(
            integration.calendar_id,
            bookingData
          );

          results.createdEvents.push(createdEvent.id || 'unknown');
        } catch (error) {
          console.error(`Error creating event in ${integration.provider} calendar:`, error);
          results.errors.push(`Failed to create event in ${integration.calendar_name}`);
          results.success = false;
        }
      }

      return results;
    } catch (error) {
      console.error('Error in createBookingEvent:', error);
      results.success = false;
      results.errors.push('Unexpected error creating calendar events');
      return results;
    }
  }

  /**
   * Update a booking event in external calendars
   */
  static async updateBookingEvent(
    userId: string,
    externalEventIds: string[],
    bookingData: {
      title?: string;
      description?: string;
      startTime?: Date;
      endTime?: Date;
      location?: string;
    }
  ): Promise<{ success: boolean; updatedEvents: string[]; errors: string[] }> {
    const supabase = createAdminClient();
    const results = {
      success: true,
      updatedEvents: [] as string[],
      errors: [] as string[],
    };

    try {
      // Get integrations and events
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          calendar_integrations!inner (
            user_id,
            provider,
            calendar_id,
            access_token,
            refresh_token
          )
        `)
        .eq('calendar_integrations.user_id', userId)
        .in('external_event_id', externalEventIds);

      if (error || !events) {
        results.errors.push('Failed to fetch calendar events');
        results.success = false;
        return results;
      }

      // Update each event
      for (const event of events) {
        try {
          const integration = event.calendar_integrations;
          let calendarService: GoogleCalendarService | OutlookCalendarService;

          if (integration.provider === 'google') {
            calendarService = new GoogleCalendarService(
              integration.access_token,
              integration.refresh_token
            );
          } else if (integration.provider === 'outlook') {
            calendarService = new OutlookCalendarService(
              integration.access_token,
              integration.refresh_token
            );
          } else {
            continue;
          }

          await calendarService.updateEvent(
            integration.calendar_id,
            event.external_event_id,
            bookingData
          );

          results.updatedEvents.push(event.external_event_id);
        } catch (error) {
          console.error(`Error updating event ${event.external_event_id}:`, error);
          results.errors.push(`Failed to update event: ${event.title}`);
          results.success = false;
        }
      }

      return results;
    } catch (error) {
      console.error('Error in updateBookingEvent:', error);
      results.success = false;
      results.errors.push('Unexpected error updating calendar events');
      return results;
    }
  }

  /**
   * Delete a booking event from external calendars
   */
  static async deleteBookingEvent(
    userId: string,
    externalEventIds: string[]
  ): Promise<{ success: boolean; deletedEvents: string[]; errors: string[] }> {
    const supabase = createAdminClient();
    const results = {
      success: true,
      deletedEvents: [] as string[],
      errors: [] as string[],
    };

    try {
      // Get integrations and events
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          calendar_integrations!inner (
            user_id,
            provider,
            calendar_id,
            access_token,
            refresh_token
          )
        `)
        .eq('calendar_integrations.user_id', userId)
        .in('external_event_id', externalEventIds);

      if (error || !events) {
        results.errors.push('Failed to fetch calendar events');
        results.success = false;
        return results;
      }

      // Delete each event
      for (const event of events) {
        try {
          const integration = event.calendar_integrations;
          let calendarService: GoogleCalendarService | OutlookCalendarService;

          if (integration.provider === 'google') {
            calendarService = new GoogleCalendarService(
              integration.access_token,
              integration.refresh_token
            );
          } else if (integration.provider === 'outlook') {
            calendarService = new OutlookCalendarService(
              integration.access_token,
              integration.refresh_token
            );
          } else {
            continue;
          }

          await calendarService.deleteEvent(
            integration.calendar_id,
            event.external_event_id
          );

          results.deletedEvents.push(event.external_event_id);
        } catch (error) {
          console.error(`Error deleting event ${event.external_event_id}:`, error);
          results.errors.push(`Failed to delete event: ${event.title}`);
          results.success = false;
        }
      }

      // Remove events from our database
      await supabase
        .from('calendar_events')
        .delete()
        .eq('calendar_integrations.user_id', userId)
        .in('external_event_id', externalEventIds);

      return results;
    } catch (error) {
      console.error('Error in deleteBookingEvent:', error);
      results.success = false;
      results.errors.push('Unexpected error deleting calendar events');
      return results;
    }
  }
}

