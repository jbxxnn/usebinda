// Google Calendar integration service

import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { CalendarEvent, OAuthTokenResponse } from '@/lib/types';

type CalendarEventResponseStatus = NonNullable<CalendarEvent['attendees']>[number]['response_status'];

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Get OAuth authorization URL
   */
  static getAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? undefined,
      expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined,
      scope: tokens.scope ?? undefined,
      token_type: tokens.token_type ?? undefined,
    };
  }

  /**
   * Get list of user's calendars
   */
  async getCalendars() {
    try {
      const response = await this.calendar.calendarList.list();

      return (response.data.items ?? [])
        .filter((calendarEntry): calendarEntry is calendar_v3.Schema$CalendarListEntry & { id: string } => {
          return Boolean(calendarEntry?.id);
        })
        .map((calendarEntry) => ({
          id: calendarEntry.id,
          name: calendarEntry.summary ?? 'Untitled Calendar',
          description: calendarEntry.description ?? undefined,
          primary: Boolean(calendarEntry.primary),
          accessRole: calendarEntry.accessRole ?? 'reader',
        }));
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw new Error('Failed to fetch calendars');
    }
  }

  /**
   * Get events from a specific calendar within a date range
   */
  async getEvents(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (response.data.items ?? [])
        .filter((event): event is calendar_v3.Schema$Event => Boolean(event))
        .map((event) => this.mapGoogleEventToCalendarEvent(event));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Create a booking event in Google Calendar
   */
  async createEvent(calendarId: string, eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: Array<{ email: string; name?: string }>;
  }) {
    try {
      const event: calendar_v3.Schema$Event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'UTC',
        },
        location: eventData.location,
        attendees: eventData.attendees?.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
        })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'popup', minutes: 30 }, // 30 minutes
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return response;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update an existing event in Google Calendar
   */
  async updateEvent(calendarId: string, eventId: string, eventData: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
  }) {
    try {
      // First get the existing event
      const existingEvent = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      const updatedEvent: calendar_v3.Schema$Event = {
        ...existingEvent.data,
        summary: eventData.title || existingEvent.data?.summary || undefined,
        description: eventData.description || existingEvent.data?.description || undefined,
        location: eventData.location || existingEvent.data?.location || undefined,
        ...(eventData.startTime && {
          start: {
            dateTime: eventData.startTime.toISOString(),
            timeZone: 'UTC',
          },
        }),
        ...(eventData.endTime && {
          end: {
            dateTime: eventData.endTime.toISOString(),
            timeZone: 'UTC',
          },
        }),
      };

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: updatedEvent,
      });

      return response;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(calendarId: string, eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded(): Promise<{ access_token: string; refresh_token?: string } | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      const accessToken = credentials.access_token ?? null;
      if (!accessToken) {
        return null;
      }

      this.oauth2Client.setCredentials(credentials);

      return {
        access_token: accessToken,
        refresh_token: credentials.refresh_token ?? undefined,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Map Google Calendar event to our CalendarEvent format
   */
  private mapGoogleEventToCalendarEvent(googleEvent: calendar_v3.Schema$Event): CalendarEvent {
    const startValue = googleEvent.start?.dateTime ?? googleEvent.start?.date;
    const endValue = googleEvent.end?.dateTime ?? googleEvent.end?.date;

    if (!googleEvent.id || !startValue || !endValue) {
      throw new Error('Invalid Google Calendar event payload');
    }

    const attendees = (googleEvent.attendees ?? [])
      .filter((attendee): attendee is calendar_v3.Schema$EventAttendee & { email: string } => Boolean(attendee?.email))
      .map((attendee) => ({
        email: attendee.email,
        name: attendee.displayName ?? undefined,
        response_status: this.mapResponseStatus(attendee.responseStatus),
      }));

    return {
      id: '', // Will be set when saving to database
      integration_id: '', // Will be set when saving to database
      external_event_id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description ?? undefined,
      start_time: new Date(startValue).toISOString(),
      end_time: new Date(endValue).toISOString(),
      all_day: !googleEvent.start?.dateTime,
      location: googleEvent.location ?? undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      recurrence_rule: googleEvent.recurrence?.[0],
      status: googleEvent.status === 'confirmed' ? 'confirmed' : 
              googleEvent.status === 'cancelled' ? 'cancelled' : 'tentative',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private mapResponseStatus(status?: string | null): CalendarEventResponseStatus | undefined {
    switch (status) {
      case 'accepted':
      case 'declined':
      case 'tentative':
      case 'needsAction':
        return status;
      default:
        return undefined;
    }
  }
}

