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
  EnvelopeIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useEvents } from '../contexts/EventContext';
import { toast } from 'react-hot-toast';
import EventForm from './EventForm';

export default function EventDetails({ event, onClose, onJoinEvent, openInviteDirectly }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(openInviteDirectly);
  const [showEditForm, setShowEditForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { isUserAttending, isUserWaitlisted, getWaitlistPosition, getEventWaitlistCount, handleInviteUser, canEditEvent, handleEditEvent } = useEvents();
  
  useEffect(() => {
    // Open invite modal directly if requested
    if (openInviteDirectly) {
      setShowInviteModal(true);
    }
  }, [openInviteDirectly]);

  const handleEditSubmit = async (updatedEventData) => {
    try {
      handleEditEvent(event.id, updatedEventData);
      toast.success('Event updated successfully');
      setShowEditForm(false);
    } catch (error) {
      toast.error('Failed to update event');
      console.error('Error updating event:', error);
    }
  };

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
  const isEventActive = event.status === 'confirmed' || event.status === 'pending';
  const isEventUpcoming = new Date(event.date) > new Date();

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

  const handleCopyLink = () => {
    const eventLink = `${window.location.origin}/event/${event.id}`;
    navigator.clipboard.writeText(eventLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Link copied to clipboard!');
  };

  const handleEmailInvite = async (e) => {
    e.preventDefault();
    if (!emailInput) return;
    
    try {
      await handleInviteUser(event.id, emailInput);
      toast.success('Invite sent successfully!');
      setEmailInput('');
    } catch (error) {
      toast.error('Failed to send invite. Please try again.');
    }
  };

  const handleShareTwitter = () => {
    const text = `Join me at ${event.title}! ${event.description}`;
    const url = `${window.location.origin}/event/${event.id}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `${window.location.origin}/event/${event.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <div className="flex items-center gap-2">
              {canEditEvent(event) && (
                <button
                  onClick={() => setShowEditForm(true)}
                  className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-200"
                >
                  Edit Event
                </button>
              )}
              {canEditEvent(event) && !isPastDeadline && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-md bg-green-100 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-200 inline-flex items-center"
                >
                  <ShareIcon className="w-4 h-4 mr-1.5" />
                  Invite
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>

          {showEditForm ? (
            <div className="flex-1 overflow-y-auto p-4">
              <EventForm
                onSubmit={handleEditSubmit}
                onCancel={() => setShowEditForm(false)}
                initialData={event}
              />
            </div>
          ) : (
            // Scrollable content */}
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
          )}

          {/* Footer with action buttons */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={handleJoinClick}
                disabled={isLoading || isPastDeadline}
                className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isPastDeadline ? 'bg-gray-400 cursor-not-allowed' : getButtonStyle()
                }`}
              >
                <ButtonIcon className="w-5 h-5 mr-2" />
                {isLoading ? 'Processing...' : getButtonText()}
              </button>
            </div>
            {isPastDeadline && (
              <p className="mt-2 text-sm text-red-600 text-center">
                Registration deadline has passed
              </p>
            )}
          </div>

          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>

                <h3 className="text-lg font-semibold mb-4">Invite People to {event.title}</h3>
                
                {peopleNeeded > 0 && (
                  <div className="mb-4 text-sm bg-green-50 text-green-700 p-3 rounded-md">
                    <UserGroupIcon className="w-4 h-4 inline mr-2" />
                    This event needs {peopleNeeded} more {peopleNeeded === 1 ? 'person' : 'people'} to happen
                  </div>
                )}

                {event.registrationDeadline && (
                  <div className="mb-4 text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4 inline mr-2" />
                    Registration deadline: {format(new Date(event.registrationDeadline), 'MMM d, yyyy')}
                  </div>
                )}

                {/* Share Event Link */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Event Link
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/event/${event.id}`}
                      className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Send Email Invite */}
                <form onSubmit={handleEmailInvite} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send Email Invite
                  </label>
                  <div className="flex items-center">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-l-0 border-transparent rounded-r-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                </form>

                {/* Share on Social Media */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share on Social Media
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleShareTwitter}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-[#1DA1F2] text-sm font-medium text-white hover:bg-[#1a8cd8]"
                    >
                      Share on Twitter
                    </button>
                    <button
                      onClick={handleShareFacebook}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-[#4267B2] text-sm font-medium text-white hover:bg-[#365899]"
                    >
                      Share on Facebook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 