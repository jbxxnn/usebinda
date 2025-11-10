// Microsoft Outlook Calendar integration service

import { ConfidentialClientApplication } from '@azure/msal-node';
import type { AuthenticationResult } from '@azure/msal-node';
import type { CalendarEvent, OAuthTokenResponse } from '@/lib/types';

interface MicrosoftGraphCalendar {
  id: string;
  name?: string;
  description?: string | null;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
}

interface MicrosoftGraphEvent {
  id?: string;
  subject?: string | null;
  body?: {
    content?: string | null;
  } | null;
  start?: {
    dateTime?: string | null;
    date?: string | null;
  } | null;
  end?: {
    dateTime?: string | null;
    date?: string | null;
  } | null;
  location?: {
    displayName?: string | null;
  } | null;
  attendees?: Array<{
    emailAddress?: {
      address?: string | null;
      name?: string | null;
    } | null;
    status?: {
      response?: string | null;
    } | null;
  }> | null;
  recurrence?: {
    pattern?: {
      type?: string | null;
    } | null;
  } | null;
  isCancelled?: boolean | null;
}

type OutlookAttendeeResponseStatus =
  | 'accepted'
  | 'declined'
  | 'tentativelyAccepted'
  | 'notResponded'
  | string
  | null
  | undefined;

type CalendarEventAttendeeResponseStatus = NonNullable<CalendarEvent['attendees']>[number]['response_status'];

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
  static async getAuthUrl(): Promise<string> {
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

    return await msalInstance.getAuthCodeUrl({
      scopes,
      redirectUri: process.env.OUTLOOK_REDIRECT_URI!,
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
      redirectUri: process.env.OUTLOOK_REDIRECT_URI!,
    });

    if (!tokenResponse) {
      throw new Error('Failed to acquire Outlook tokens');
    }

    const refreshToken = OutlookCalendarService.extractRefreshToken(tokenResponse);

    return {
      access_token: tokenResponse.accessToken,
      refresh_token: refreshToken,
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
      return (data.value ?? [])
        .filter((calendarEntry: unknown): calendarEntry is MicrosoftGraphCalendar => {
          return (
            typeof calendarEntry === 'object' &&
            calendarEntry !== null &&
            typeof (calendarEntry as MicrosoftGraphCalendar).id === 'string'
          );
        })
        .map((calendarEntry: MicrosoftGraphCalendar) => ({
          id: calendarEntry.id,
          name: calendarEntry.name ?? 'Untitled Calendar',
          description: calendarEntry.description ?? undefined,
          primary: Boolean(calendarEntry.isDefaultCalendar),
          accessRole: calendarEntry.canEdit ? 'owner' : 'reader',
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

      return (data.value ?? [])
        .filter((eventEntry: unknown): eventEntry is MicrosoftGraphEvent => {
          return typeof eventEntry === 'object' && eventEntry !== null;
        })
        .map((eventEntry: MicrosoftGraphEvent) => this.mapOutlookEventToCalendarEvent(eventEntry));
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
      const updateData: Record<string, unknown> = {};
      
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

      if (!tokenResponse) {
        return null;
      }

      this.accessToken = tokenResponse.accessToken;
      const refreshToken = OutlookCalendarService.extractRefreshToken(tokenResponse);
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }

      return {
        access_token: tokenResponse.accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Safely extract the refresh token from MSAL authentication results
   */
  private static extractRefreshToken(result: AuthenticationResult | null): string | undefined {
    if (!result) {
      return undefined;
    }

    const candidate = (result as AuthenticationResult & { refreshToken?: string | null }).refreshToken;
    return candidate ?? undefined;
  }

  /**
   * Map Outlook Calendar event to our CalendarEvent format
   */
  private mapOutlookEventToCalendarEvent(outlookEvent: MicrosoftGraphEvent): CalendarEvent {
    const start = outlookEvent.start?.dateTime ?? outlookEvent.start?.date;
    const end = outlookEvent.end?.dateTime ?? outlookEvent.end?.date;

    if (!outlookEvent.id || !start || !end) {
      throw new Error('Invalid Outlook event payload');
    }

    const attendees = (outlookEvent.attendees ?? [])
      .filter((attendee): attendee is NonNullable<MicrosoftGraphEvent['attendees']>[number] => {
        return Boolean(attendee?.emailAddress?.address);
      })
      .map((attendee) => ({
        email: attendee.emailAddress?.address as string,
        name: attendee.emailAddress?.name ?? undefined,
        response_status: this.mapOutlookResponseStatus(attendee.status?.response),
      }))
      .filter((attendee) => attendee.email);

    return {
      id: '', // Will be set when saving to database
      integration_id: '', // Will be set when saving to database
      external_event_id: outlookEvent.id,
      title: outlookEvent.subject || 'Untitled Event',
      description: outlookEvent.body?.content ?? undefined,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      all_day: !outlookEvent.start?.dateTime,
      location: outlookEvent.location?.displayName ?? undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      recurrence_rule: outlookEvent.recurrence?.pattern?.type ?? undefined,
      status: outlookEvent.isCancelled ? 'cancelled' : 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private mapOutlookResponseStatus(
    status: OutlookAttendeeResponseStatus
  ): CalendarEventAttendeeResponseStatus | undefined {
    switch (status) {
      case 'accepted':
      case 'declined':
      case 'tentativelyAccepted':
      case 'notResponded':
        return status === 'tentativelyAccepted'
          ? 'tentative'
          : status === 'notResponded'
            ? 'needsAction'
            : status;
      default:
        return undefined;
    }
  }
}

