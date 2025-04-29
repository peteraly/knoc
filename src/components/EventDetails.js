import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  XMarkIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  GiftIcon,
  UserMinusIcon,
  ShareIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useEvents } from '../contexts/EventContext';
import { toast } from 'react-hot-toast';

const EventDetails = ({ event, onClose, onJoinEvent, openInviteDirectly }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(openInviteDirectly);
  const { isUserAttending, isUserWaitlisted, getWaitlistPosition, getEventWaitlistCount, handleInviteUser } = useEvents();
  
  useEffect(() => {
    // Open invite modal directly if requested
    if (openInviteDirectly) {
      setShowInviteModal(true);
    }
  }, [openInviteDirectly]);

  if (!event) return null;

  const currentAttendees = event.attendees.length;
  const spotsLeft = event.maxAttendees - currentAttendees;
  const peopleNeeded = Math.max(0, event.minAttendees - currentAttendees);
  const isAttending = isUserAttending(event.id);
  const isWaitlisted = isUserWaitlisted(event.id);
  const waitlistPosition = isWaitlisted ? getWaitlistPosition(event.id) : -1;
  const totalWaitlisted = getEventWaitlistCount(event.id);
  const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isFull = currentAttendees >= event.maxAttendees;

  const handleJoinClick = async () => {
    setIsLoading(true);
    try {
      await onJoinEvent(event);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isAttending) return 'Leave Event';
    if (isWaitlisted) return 'Leave Waitlist';
    if (isFull) return 'Join Waitlist';
    return 'Join Event';
  };

  const getButtonStyle = () => {
    if (isAttending) return 'bg-red-600 hover:bg-red-700';
    if (isWaitlisted) return 'bg-yellow-600 hover:bg-yellow-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getButtonIcon = () => {
    if (isAttending || isWaitlisted) return UserMinusIcon;
    return UserPlusIcon;
  };

  const ButtonIcon = getButtonIcon();

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-xl flex flex-col z-50">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="text-2xl mr-2">{event.emoji}</span>
          {event.title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <XMarkIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Description */}
        <p className="text-gray-600 mb-6">{event.description}</p>

        {/* Key details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-5 h-5 mr-3" />
            <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <ClockIcon className="w-5 h-5 mr-3" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-start text-gray-600">
            <MapPinIcon className="w-5 h-5 mr-3 mt-1" />
            <span>{event.location}</span>
          </div>
        </div>

        {/* Attendance info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">Attendance</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Current attendees</span>
              <span className="font-medium">{currentAttendees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Maximum capacity</span>
              <span className="font-medium">{event.maxAttendees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Minimum needed</span>
              <span className="font-medium">{event.minAttendees}</span>
            </div>
            {peopleNeeded > 0 && (
              <div className="mt-3 flex items-center text-green-700 bg-green-50 px-3 py-2 rounded-md">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">{peopleNeeded} more people needed</span>
              </div>
            )}
            {spotsLeft > 0 && (
              <div className="mt-1 text-sm text-gray-500">
                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
              </div>
            )}
            {isWaitlisted && (
              <div className="mt-3 flex items-center text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md">
                <ClockIcon className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-medium">Waitlist Position: #{waitlistPosition}</div>
                  <div className="text-sm">Total Waitlisted: {totalWaitlisted}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        {(event.pricing?.standard > 0 || event.pricing?.earlyBird) && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Pricing</h3>
            <div className="space-y-2">
              {event.pricing.standard > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Standard price</span>
                  <span className="font-medium">${event.pricing.standard}</span>
                </div>
              )}
              {event.pricing.earlyBird && (
                <div className="flex items-center justify-between text-green-700">
                  <span>Early bird price</span>
                  <span className="font-medium">${event.pricing.earlyBird}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Perks */}
        {event.perks?.standard?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">What's Included</h3>
            <ul className="space-y-2">
              {event.perks.standard.map((perk, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <GiftIcon className="w-5 h-5 mr-3" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Important dates */}
        <div className="space-y-2 mb-6">
          <h3 className="font-medium mb-3">Important Dates</h3>
          {event.registrationDeadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Registration deadline</span>
              <span className="font-medium">
                {format(new Date(event.registrationDeadline), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {event.cancellationDeadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Cancellation deadline</span>
              <span className="font-medium">
                {format(new Date(event.cancellationDeadline), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t p-4 space-y-3">
        <button
          onClick={handleJoinClick}
          disabled={isLoading || isPastDeadline}
          className={`w-full flex items-center justify-center gap-2 ${getButtonStyle()} text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <ButtonIcon className="w-5 h-5" />
              {getButtonText()}
            </>
          )}
        </button>

        {/* Invite button - show only when more people are needed and user is attending */}
        {peopleNeeded > 0 && isAttending && (
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={isPastDeadline}
            className={`w-full flex items-center justify-center gap-2 ${
              isPastDeadline ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            } text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed`}
          >
            <ShareIcon className="w-5 h-5" />
            {isPastDeadline ? 'Registration Closed' : `Invite ${peopleNeeded} More ${peopleNeeded === 1 ? 'Person' : 'People'}`}
          </button>
        )}

        {isPastDeadline && (
          <p className="mt-2 text-sm text-red-600 text-center">
            Registration deadline has passed. No new attendees can be added.
          </p>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Invite People to {event.title}
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center text-gray-600 mb-4">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                <span>This event needs <span className="font-bold text-green-600">{peopleNeeded}</span> more {peopleNeeded === 1 ? 'person' : 'people'} to happen</span>
              </div>
              {event.registrationDeadline && (
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span className={isPastDeadline ? 'text-red-600 font-medium' : ''}>
                    {isPastDeadline ? 'Registration closed on' : 'Registration deadline:'} {format(new Date(event.registrationDeadline), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {isPastDeadline ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-medium">Registration Deadline Has Passed</p>
                <p className="text-sm mt-1">New attendees can no longer be added to this event.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Share Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share Event Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/event/${event.id}`}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-gray-600"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
                        toast.success('Link copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Email Invite */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Send Email Invite</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <EnvelopeIcon className="w-5 h-5" />
                        Send
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Recipients will receive an email with event details and a link to join
                    </p>
                  </div>
                </div>

                {/* Share on Social Media */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share on Social Media</label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors">
                      Share on Twitter
                    </button>
                    <button className="flex-1 px-4 py-2 bg-[#4267B2] text-white rounded-lg hover:bg-[#365899] transition-colors">
                      Share on Facebook
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails; 