import React, { useState } from 'react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const getInviteMessage = (event) => {
  return `I'd love for you to join me at ${event.title}! Details here: http://localhost:3000/event/${event.id}`;
};

const InviteModal = ({ event, onClose }) => {
  const [emailInput, setEmailInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const peopleNeeded = Math.max(0, (event.minAttendees || 0) - (event.attendees?.length || 0));
  const inviteMessage = getInviteMessage(event);
  const eventLink = `http://localhost:3000/event/${event.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEmailInvite = (e) => {
    e.preventDefault();
    // Open mail client with pre-filled message
    window.open(`mailto:${emailInput}?subject=Join me at ${event.title}!&body=${encodeURIComponent(inviteMessage)}`);
    setEmailInput('');
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(eventLink);
    const text = encodeURIComponent(inviteMessage);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(eventLink);
    const quote = encodeURIComponent(inviteMessage);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank');
  };

  const handleShareSMS = () => {
    const smsBody = encodeURIComponent(inviteMessage);
    window.open(`sms:?&body=${smsBody}`);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black bg-opacity-50" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-xl font-semibold text-gray-900">
              Invite People to {event.title}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* People Needed Banner */}
            {peopleNeeded > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center space-x-3">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
                <p className="text-green-700">
                  This event needs {peopleNeeded} more {peopleNeeded === 1 ? 'person' : 'people'} to happen
                </p>
              </div>
            )}

            {/* Share Link Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Share Event Link</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventLink}
                  readOnly
                  className="flex-1 p-2 text-sm bg-gray-50 border rounded-md"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${isCopied ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Email Invite Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Send Email Invite</h4>
              <form onSubmit={handleEmailInvite} className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 p-2 text-sm border rounded-md"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Send
                </button>
              </form>
            </div>

            {/* SMS/Text Invite Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Share via Text/SMS</h4>
              <button
                onClick={handleShareSMS}
                className="w-full py-2 px-4 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
              >
                Share via Text/SMS
              </button>
            </div>

            {/* Social Share Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Share on Social Media</h4>
              <div className="flex gap-2">
                <button
                  onClick={handleShareTwitter}
                  className="flex-1 py-2 px-4 text-sm font-medium text-[#1DA1F2] bg-[#1DA1F2]/10 rounded-md hover:bg-[#1DA1F2]/20"
                >
                  Share on Twitter
                </button>
                <button
                  onClick={handleShareFacebook}
                  className="flex-1 py-2 px-4 text-sm font-medium text-[#4267B2] bg-[#4267B2]/10 rounded-md hover:bg-[#4267B2]/20"
                >
                  Share on Facebook
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-4 py-3 rounded-b-lg">
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal; 