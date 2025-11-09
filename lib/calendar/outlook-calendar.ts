// Microsoft Outlook Calendar integration service

import { ConfidentialClientApplication } from '@azure/msal-node';
import type { CalendarEvent, OAuthTokenResponse } from '@/lib/types';

export class OutlookCalendarService {
  private msalInstance: ConfidentialClientApplication;
  private accessToken: string;
  private refreshToken?: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
        authority: 'https://login.microsoftonline.com/common',
      },
    });
  }

  /**
   * Get OAuth authorization URL
   */
  static getAuthUrl(): string {
    const msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
        authority: 'https://login.microsoftonline.com/common',
      },
    });

    const scopes = [
      'https://graph.microsoft.com/calendars.read',
      'https://graph.microsoft.com/calendars.readwrite',
    ];

    return msalInstance.getAuthCodeUrl({
      scopes,
      redirectUri: process.env.OUTLOOK_REDIRECT_URI,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
    const msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
        authority: 'https://login.microsoftonline.com/common',
      },
    });

    const tokenResponse = await msalInstance.acquireTokenByCode({
      code,
      scopes: [
        'https://graph.microsoft.com/calendars.read',
        'https://graph.microsoft.com/calendars.readwrite',
      ],
      redirectUri: process.env.OUTLOOK_REDIRECT_URI,
    });

    return {
      access_token: tokenResponse.accessToken,
      refresh_token: tokenResponse.refreshToken,
      expires_in: tokenResponse.expiresOn ? Math.floor((tokenResponse.expiresOn.getTime() - Date.now()) / 1000) : undefined,
      scope: tokenResponse.scopes?.join(' '),
      token_type: 'Bearer',
    };
  }

  /**
   * Get list of user's calendars
   */
  async getCalendars() {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.value?.map((calendar: any) => ({
        id: calendar.id,
        name: calendar.name,
        description: calendar.description,
        primary: calendar.isDefaultCalendar,
        accessRole: calendar.canEdit ? 'owner' : 'reader',
      })) || [];
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
      const startTime = startDate.toISOString();
      const endTime = endDate.toISOString();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events?$filter=start/dateTime ge '${startTime}' and end/dateTime le '${endTime}'&$orderby=start/dateTime`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.value?.map((event: any) => this.mapOutlookEventToCalendarEvent(event, calendarId)) || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Create a booking event in Outlook Calendar
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
      const event = {
        subject: eventData.title,
        body: {
          contentType: 'HTML',
          content: eventData.description || '',
        },
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'UTC',
        },
        location: {
          displayName: eventData.location || '',
        },
        attendees: eventData.attendees?.map(attendee => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name || attendee.email,
          },
          type: 'required',
        })),
        reminderMinutesBeforeStart: 30,
      };

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update an existing event in Outlook Calendar
   */
  async updateEvent(calendarId: string, eventId: string, eventData: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
  }) {
    try {
      const updateData: any = {};
      
      if (eventData.title) updateData.subject = eventData.title;
      if (eventData.description) {
        updateData.body = {
          contentType: 'HTML',
          content: eventData.description,
        };
      }
      if (eventData.location) {
        updateData.location = {
          displayName: eventData.location,
        };
      }
      if (eventData.startTime) {
        updateData.start = {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (eventData.endTime) {
        updateData.end = {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'UTC',
        };
      }

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete an event from Outlook Calendar
   */
  async deleteEvent(calendarId: string, eventId: string) {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      if (!this.refreshToken) {
        return null;
      }

      const tokenResponse = await this.msalInstance.acquireTokenByRefreshToken({
        refreshToken: this.refreshToken,
        scopes: [
          'https://graph.microsoft.com/calendars.read',
          'https://graph.microsoft.com/calendars.readwrite',
        ],
      });

      this.accessToken = tokenResponse.accessToken;
      if (tokenResponse.refreshToken) {
        this.refreshToken = tokenResponse.refreshToken;
      }

      return {
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.refreshToken,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Map Outlook Calendar event to our CalendarEvent format
   */
  private mapOutlookEventToCalendarEvent(outlookEvent: any, calendarId: string): CalendarEvent {
    const start = outlookEvent.start?.dateTime || outlookEvent.start?.date;
    const end = outlookEvent.end?.dateTime || outlookEvent.end?.date;
    
    return {
      id: '', // Will be set when saving to database
      integration_id: '', // Will be set when saving to database
      external_event_id: outlookEvent.id,
      title: outlookEvent.subject || 'Untitled Event',
      description: outlookEvent.body?.content,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      all_day: !outlookEvent.start?.dateTime,
      location: outlookEvent.location?.displayName,
      attendees: outlookEvent.attendees?.map((attendee: any) => ({
        email: attendee.emailAddress.address,
        name: attendee.emailAddress.name,
        response_status: attendee.status?.response === 'accepted' ? 'accepted' :
                        attendee.status?.response === 'declined' ? 'declined' :
                        attendee.status?.response === 'tentative' ? 'tentative' : 'needsAction',
      })),
      recurrence_rule: outlookEvent.recurrence?.pattern?.type,
      status: outlookEvent.isCancelled ? 'cancelled' : 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

