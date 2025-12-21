import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProviderInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Configuration</CardTitle>
        <CardDescription>Configure delivery providers for each channel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm mb-2">Email Providers</h4>
            <p className="text-sm text-gray-600">
              Connect SMTP servers or use email service providers like Mailjet, SendGrid, or Amazon
              SES
            </p>
          </div>
          <div>
            <h4 className="text-sm mb-2">Push Notification Providers</h4>
            <p className="text-sm text-gray-600">
              Configure FCM (Android) and APNs (iOS) credentials for mobile push notifications
            </p>
          </div>
          <div>
            <h4 className="text-sm mb-2">SMS Providers</h4>
            <p className="text-sm text-gray-600">
              Add Twilio, Vonage, or other SMS gateway credentials for text message delivery
            </p>
          </div>
          <div>
            <h4 className="text-sm mb-2">Web Push Providers</h4>
            <p className="text-sm text-gray-600">
              Set up OneSignal, Pusher, or other web push notification services
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
