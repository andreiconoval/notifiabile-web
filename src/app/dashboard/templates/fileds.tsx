import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function EmailFields() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="emailSubject">Subject Line</Label>
        <Input id="emailSubject" name="emailSubject" placeholder="Welcome to our platform!" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="emailHtml">Email Body (HTML)</Label>
        <Textarea
          id="emailHtml"
          name="emailHtml"
          placeholder={'<h1>Welcome {{name}}!</h1>'}
          rows={8}
          required
        />
        <p className="text-xs text-gray-500">Use {'{{variableName}}'} for dynamic content</p>{' '}
      </div>
    </>
  );
}

export function PushFields() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="pushTitle">Subject Line</Label>
        <Input id="pushTitle" name="pushTitle" placeholder="Welcome to our platform!" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pushBody">Notification Body</Label>
        <Textarea
          id="pushBody"
          name="pushBody"
          placeholder={'Hello {{name}}, welcome!'}
          rows={8}
          required
        />
        <p className="text-xs text-gray-500">Use {'{{variableName}}'} for dynamic content</p>
      </div>
    </>
  );
}

export function SMSFields() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="smsText">Email Body (HTML)</Label>
        <Textarea
          id="smsText"
          name="smsText"
          placeholder={'Hello {{name}}, welcome!'}
          rows={8}
          required
        />
        <p className="text-xs text-gray-500">Use {'{{variableName}}'} for dynamic content</p>{' '}
      </div>
    </>
  );
}

export function WebPushFields() {
  return <></>;
}

export function InternalFields() {
  return <></>;
}
