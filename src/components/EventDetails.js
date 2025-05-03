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
  CheckCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useEvents } from '../contexts/EventContext';
import { useFriends } from '../contexts/FriendsContext';
import { toast } from 'react-hot-toast';
import EventForm from './EventForm';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function EventDetails({ event, onClose, onJoinEvent, openInviteDirectly }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(openInviteDirectly || false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { isUserAttending, isUserWaitlisted, getWaitlistPosition, getEventWaitlistCount, handleInviteUser, canEditEvent, handleEditEvent } = useEvents();
  const { friends } = useFriends();
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  useEffect(() => {
    console.log('EventDetails: openInviteDirectly effect triggered:', {
      openInviteDirectly,
      eventTitle: event?.title,
      eventId: event?.id,
      showInviteModal,
      timestamp: new Date().toISOString()
    });
    
    if (openInviteDirectly) {
      setShowInviteModal(true);
    }
  }, [openInviteDirectly]);

  useEffect(() => {
    console.log('EventDetails: Event changed:', {
      eventTitle: event?.title,
      eventId: event?.id,
      openInviteDirectly,
      showInviteModal,
      timestamp: new Date().toISOString()
    });
    
    setShowEditForm(false);
    setEmailInput('');
    setIsCopied(false);
    
    if (!openInviteDirectly) {
      setShowInviteModal(false);
    }
  }, [event]);

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

  const handleCloseInviteModal = () => {
    console.log('EventDetails: Closing invite modal');
    setShowInviteModal(false);
    setEmailInput('');
    setIsCopied(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    const newFiles = validFiles.map(file => ({
      id: uuidv4(),
      file,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      preview: URL.createObjectURL(file),
      uploadProgress: 0
    }));

    setMediaFiles(prev => [...prev, ...newFiles]);
    
    // Simulate upload progress
    newFiles.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({
          ...prev,
          [file.id]: progress
        }));
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 200);
    });
  };

  const removeMedia = (id) => {
    setMediaFiles(prev => prev.filter(file => file.id !== id));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
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
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <p className="text-gray-600 mb-6">{event.description}</p>

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

                        {/* Media Upload Section */}
                        <div className="mt-6">
                          <h3 className="text-lg font-medium text-gray-900">Event Media</h3>
                          <div 
                            className={`mt-2 border-2 border-dashed rounded-lg p-6 ${
                              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className="text-center">
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                                >
                                  <span>Upload files</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileInput}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs leading-5 text-gray-600">
                                PNG, JPG, GIF up to 10MB, MP4 up to 100MB
                              </p>
                            </div>
                          </div>

                          {/* Media Preview Grid */}
                          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {mediaFiles.map((media) => (
                              <div key={media.id} className="relative group">
                                {media.type === 'image' ? (
                                  <img
                                    src={media.preview}
                                    alt="Preview"
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                ) : (
                                  <video
                                    src={media.preview}
                                    className="w-full h-32 object-cover rounded-lg"
                                    controls
                                  />
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <button
                                    onClick={() => removeMedia(media.id)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                  {uploadProgress[media.id] < 100 && (
                                    <div className="absolute bottom-2 left-2 right-2 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${uploadProgress[media.id]}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {event.media && event.media.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900">Event Media</h3>
                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                              {event.media.map((media, idx) => (
                                <div key={idx} className="relative group">
                                  {media.type === 'image' ? (
                                    <img
                                      src={media.url}
                                      alt={`Event media ${idx + 1}`}
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                  ) : (
                                    <video
                                      src={media.url}
                                      className="w-full h-32 object-cover rounded-lg"
                                      controls
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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

                        {showInviteModal && (
                          <div 
                            className="fixed inset-0 z-[70] overflow-y-auto bg-black bg-opacity-50"
                            onClick={handleCloseInviteModal}
                          >
                            <div className="flex min-h-full items-center justify-center p-4">
                              <div 
                                className="relative w-full max-w-lg bg-white rounded-lg shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between p-4 border-b">
                                  <h3 className="text-xl font-semibold text-gray-900">
                                    Invite People to {event.title}
                                  </h3>
                                  <button
                                    onClick={handleCloseInviteModal}
                                    className="text-gray-400 hover:text-gray-500"
                                  >
                                    <XMarkIcon className="h-6 w-6" />
                                  </button>
                                </div>

                                <div className="p-6 space-y-6">
                                  {peopleNeeded > 0 && (
                                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center space-x-3">
                                      <UserGroupIcon className="h-6 w-6 text-green-600" />
                                      <p className="text-green-700">
                                        This event needs {peopleNeeded} more {peopleNeeded === 1 ? 'person' : 'people'} to happen
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Share Event Link
                                    </h4>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={`http://localhost:3000/event/${event.id}`}
                                        readOnly
                                        className="flex-1 p-2 text-sm bg-gray-50 border rounded-md"
                                      />
                                      <button
                                        onClick={handleCopyLink}
                                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                                          isCopied 
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                      >
                                        {isCopied ? 'Copied!' : 'Copy'}
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Send Email Invite
                                    </h4>
                                    <form onSubmit={handleEmailInvite} className="flex gap-2">
                                      <input
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
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

                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Share on Social Media
                                    </h4>
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

                                <div className="bg-gray-50 px-4 py-3 rounded-b-lg">
                                  <button
                                    onClick={handleCloseInviteModal}
                                    className="w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 