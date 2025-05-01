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
import { useFriends } from '../contexts/FriendsContext';
import { toast } from 'react-hot-toast';
import EventForm from './EventForm';

export default function EventDetails({ event, onClose, onJoinEvent, openInviteDirectly }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(openInviteDirectly || false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { isUserAttending, isUserWaitlisted, getWaitlistPosition, getEventWaitlistCount, handleInviteUser, canEditEvent, handleEditEvent } = useEvents();
  const { friends } = useFriends();
  
  useEffect(() => {
    setShowInviteModal(openInviteDirectly);
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

  const getNetworkAttendees = () => {
    if (!event.attendees || !friends) return [];
    return event.attendees.filter(attendeeId => 
      friends.some(friend => friend.id === attendeeId)
    ).map(attendeeId => friends.find(friend => friend.id === attendeeId));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
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
              {(canEditEvent(event) || isAttending) && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-md bg-green-100 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-200 inline-flex items-center"
                >
                  <UserPlusIcon className="w-4 h-4 mr-1.5" />
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
                    <span className="text-gray-600">Available seats</span>
                    <span className="font-medium">{event.maxAttendees - currentAttendees} open</span>
                  </div>
                  {event.minAttendees > currentAttendees && (
                    <div className="flex items-center justify-between text-purple-700">
                      <span>Needed for event</span>
                      <span className="font-medium">{event.minAttendees - currentAttendees} more people</span>
                    </div>
                  )}
                  {getNetworkAttendees().length > 0 ? (
                    <div className="mt-3 flex items-center text-gray-700">
                      <UserGroupIcon className="w-5 h-5 mr-2" />
                      <span>
                        {getNetworkAttendees()[0].name} + {currentAttendees - 1} {currentAttendees - 1 === 1 ? 'other is' : 'others are'} going
                      </span>
                    </div>
                  ) : (
                    currentAttendees > 0 && (
                      <div className="mt-3 flex items-center text-gray-700">
                        <UserGroupIcon className="w-5 h-5 mr-2" />
                        <span>{currentAttendees} people going</span>
                      </div>
                    )
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
            <div 
              className="fixed inset-0 z-[60] overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowInviteModal(false);
                  setEmailInput('');
                }
              }}
            >
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div 
                  className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Invite to Event</h3>
                          <button
                            onClick={() => {
                              setShowInviteModal(false);
                              setEmailInput('');
                            }}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>

                        {/* Event Info */}
                        <div className="mb-6">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {peopleNeeded > 0 
                              ? `${peopleNeeded} more ${peopleNeeded === 1 ? 'person' : 'people'} needed`
                              : 'Event is ready to go!'
                            }
                          </p>
                        </div>

                        {/* Share Link */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share Link
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={`${window.location.origin}/event/${event.id}`}
                              readOnly
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                              onClick={handleCopyLink}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        {/* Email Invite */}
                        <form onSubmit={handleEmailInvite} className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Invite by Email
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="Enter email address"
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Send
                            </button>
                          </div>
                        </form>

                        {/* Social Share */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share on Social Media
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={handleShareTwitter}
                              className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Twitter
                            </button>
                            <button
                              onClick={handleShareFacebook}
                              className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Facebook
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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