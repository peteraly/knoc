import React, { useState, useEffect } from 'react';
import LocationAutocomplete from './LocationAutocomplete';
import { useEvents } from '../contexts/EventContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const EventForm = ({ onSubmit, onCancel, initialData }) => {
  const { eventCategories, getCategoryEmoji } = useEvents();
  
  // Section visibility states
  const [openSections, setOpenSections] = useState({
    basicInfo: true,
    details: false,
    accessControl: false,
    pricing: false,
    perks: false
  });

  // Deadline toggles
  const [hasRegistrationDeadline, setHasRegistrationDeadline] = useState(false);
  const [hasCancellationDeadline, setHasCancellationDeadline] = useState(false);
  const [hasConfirmationDeadline, setHasConfirmationDeadline] = useState(false);

  // Toggle section visibility
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [coordinates, setCoordinates] = useState(initialData?.coordinates || null);
  const [category, setCategory] = useState(initialData?.category || 'dining');
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
  const [emoji, setEmoji] = useState(initialData?.emoji || '🍽️');
  const [maxAttendees, setMaxAttendees] = useState(initialData?.maxAttendees || 50);
  const [vipSpots, setVipSpots] = useState(initialData?.vipSpots || 0);
  const [groupMaxSize, setGroupMaxSize] = useState(initialData?.groupMaxSize || 1);
  const [registrationDeadline, setRegistrationDeadline] = useState(initialData?.registrationDeadline || '');
  const [cancellationDeadline, setCancellationDeadline] = useState(initialData?.cancellationDeadline || '');
  const [minAttendees, setMinAttendees] = useState(initialData?.minAttendees || 5);
  const [confirmationDeadline, setConfirmationDeadline] = useState(initialData?.confirmationDeadline || '');
  
  // New fields for enhanced event types
  const [eventType, setEventType] = useState(initialData?.eventType || 'standard');
  const [accessControlType, setAccessControlType] = useState(initialData?.accessControl?.type || 'public');
  const [requiredBadges, setRequiredBadges] = useState(initialData?.accessControl?.requiredBadges || []);
  const [minPoints, setMinPoints] = useState(initialData?.accessControl?.minPoints || 0);
  const [inviteList, setInviteList] = useState(initialData?.accessControl?.inviteList || []);
  
  // Partner info
  const [partnerId, setPartnerId] = useState(initialData?.partnerInfo?.partnerId || '');
  const [partnerName, setPartnerName] = useState(initialData?.partnerInfo?.partnerName || '');
  const [verificationLevel, setVerificationLevel] = useState(initialData?.partnerInfo?.verificationLevel || '');
  
  // VIP requirements
  const [vipPoints, setVipPoints] = useState(initialData?.vipRequirements?.points || 0);
  const [vipBadges, setVipBadges] = useState(initialData?.vipRequirements?.badges || []);
  const [vipMemberSince, setVipMemberSince] = useState(initialData?.vipRequirements?.memberSince || '');
  
  // Pricing
  const [standardPrice, setStandardPrice] = useState(initialData?.pricing?.standard || 0);
  const [vipPrice, setVipPrice] = useState(initialData?.pricing?.vip || 0);
  const [earlyBirdPrice, setEarlyBirdPrice] = useState(initialData?.pricing?.earlyBird || 0);
  const [earlyBirdVipPrice, setEarlyBirdVipPrice] = useState(initialData?.pricing?.earlyBirdVip || 0);
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState(initialData?.pricing?.earlyBirdDeadline || '');
  
  // Perks
  const [standardPerks, setStandardPerks] = useState(initialData?.perks?.standard || []);
  const [vipPerks, setVipPerks] = useState(initialData?.perks?.vip || []);
  const [newStandardPerk, setNewStandardPerk] = useState('');
  const [newVipPerk, setNewVipPerk] = useState('');

  // New fields for host management
  const [requiredHosts, setRequiredHosts] = useState(initialData?.requiredHosts || 1);
  const [hostingStyle, setHostingStyle] = useState(initialData?.hostingStyle || 'single');

  // Update emoji when category or subcategory changes
  useEffect(() => {
    if (category && subcategory) {
      const newEmoji = getCategoryEmoji(category, subcategory);
      if (newEmoji) setEmoji(newEmoji);
    } else if (category) {
      const newEmoji = getCategoryEmoji(category);
      if (newEmoji) setEmoji(newEmoji);
    }
  }, [category, subcategory, getCategoryEmoji]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!coordinates) {
      alert('Please select a location from the suggestions');
      return;
    }
    
    // Build the event data object
    const eventData = {
      title,
      description,
      date,
      time,
      location,
      coordinates,
      category,
      subcategory,
      emoji,
      maxAttendees: parseInt(maxAttendees, 10),
      vipSpots: parseInt(vipSpots, 10),
      groupMaxSize: parseInt(groupMaxSize, 10),
      registrationDeadline: hasRegistrationDeadline ? registrationDeadline : null,
      cancellationDeadline: hasCancellationDeadline ? cancellationDeadline : null,
      minAttendees: parseInt(minAttendees, 10),
      confirmationDeadline: hasConfirmationDeadline ? confirmationDeadline : null,
      eventType,
      accessControl: {
        type: accessControlType,
        requiredBadges,
        minPoints: parseInt(minPoints, 10),
        inviteList
      },
      partnerInfo: eventType === 'partner' ? {
        partnerId,
        partnerName,
        verificationLevel
      } : null,
      vipRequirements: eventType === 'vip' ? {
        points: parseInt(vipPoints, 10),
        badges: vipBadges,
        memberSince: vipMemberSince
      } : null,
      pricing: {
        standard: parseFloat(standardPrice),
        vip: parseFloat(vipPrice),
        earlyBird: parseFloat(earlyBirdPrice),
        earlyBirdVip: parseFloat(earlyBirdVipPrice),
        earlyBirdDeadline
      },
      perks: {
        standard: standardPerks,
        vip: vipPerks
      },
      requiredHosts,
      hostingStyle
    };
    
    onSubmit(eventData);
  };

  const addStandardPerk = () => {
    if (newStandardPerk.trim()) {
      setStandardPerks([...standardPerks, newStandardPerk.trim()]);
      setNewStandardPerk('');
    }
  };

  const addVipPerk = () => {
    if (newVipPerk.trim()) {
      setVipPerks([...vipPerks, newVipPerk.trim()]);
      setNewVipPerk('');
    }
  };

  const removeStandardPerk = (index) => {
    setStandardPerks(standardPerks.filter((_, i) => i !== index));
  };

  const removeVipPerk = (index) => {
    setVipPerks(vipPerks.filter((_, i) => i !== index));
  };

  // Get available subcategories based on selected category
  const getSubcategories = () => {
    const selectedCategory = eventCategories.find(cat => cat.id === category);
    return selectedCategory?.subcategories || [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info Section */}
      <div className="bg-white rounded-lg shadow">
        <button
          type="button"
          className="w-full px-6 py-4 flex justify-between items-center text-left border-b border-gray-200"
          onClick={() => toggleSection('basicInfo')}
        >
          <h3 className="text-xl font-medium text-gray-900">Basic Information</h3>
          {openSections.basicInfo ? (
            <ChevronUpIcon className="h-6 w-6 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-gray-500" />
          )}
        </button>
        
        {openSections.basicInfo && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event title"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Event description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  onCoordinatesChange={setCoordinates}
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Section */}
      <div className="bg-white rounded-lg shadow">
        <button
          type="button"
          className="w-full px-6 py-4 flex justify-between items-center text-left border-b border-gray-200"
          onClick={() => toggleSection('details')}
        >
          <h3 className="text-xl font-medium text-gray-900">Event Details</h3>
          {openSections.details ? (
            <ChevronUpIcon className="h-6 w-6 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-gray-500" />
          )}
        </button>

        {openSections.details && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {eventCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subcategory</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subcategory</option>
                  {getSubcategories().map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.emoji} {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hosting Style</label>
                <select
                  value={hostingStyle}
                  onChange={(e) => setHostingStyle(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single">Single Host</option>
                  <option value="multi">Multiple Hosts</option>
                  <option value="collaborative">Collaborative Hosting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Min Attendees</label>
                <input
                  type="number"
                  value={minAttendees}
                  onChange={(e) => setMinAttendees(Math.max(1, parseInt(e.target.value)))}
                  min="1"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Attendees</label>
                <input
                  type="number"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(Math.max(minAttendees, parseInt(e.target.value)))}
                  min={minAttendees}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Required Hosts</label>
                <input
                  type="number"
                  value={requiredHosts}
                  onChange={(e) => setRequiredHosts(Math.max(1, parseInt(e.target.value)))}
                  min="1"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Deadlines Section */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Deadlines</h4>
                <div className="space-y-4">
                  {/* Registration Deadline */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Registration Deadline</label>
                      <button
                        type="button"
                        onClick={() => setHasRegistrationDeadline(!hasRegistrationDeadline)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          hasRegistrationDeadline
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hasRegistrationDeadline ? 'Set' : 'None'}
                      </button>
                    </div>
                    {hasRegistrationDeadline && (
                      <input
                        type="datetime-local"
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* Cancellation Deadline */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Cancellation Deadline</label>
                      <button
                        type="button"
                        onClick={() => setHasCancellationDeadline(!hasCancellationDeadline)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          hasCancellationDeadline
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hasCancellationDeadline ? 'Set' : 'None'}
                      </button>
                    </div>
                    {hasCancellationDeadline && (
                      <input
                        type="datetime-local"
                        value={cancellationDeadline}
                        onChange={(e) => setCancellationDeadline(e.target.value)}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* Confirmation Deadline */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Confirmation Deadline</label>
                      <button
                        type="button"
                        onClick={() => setHasConfirmationDeadline(!hasConfirmationDeadline)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          hasConfirmationDeadline
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hasConfirmationDeadline ? 'Set' : 'None'}
                      </button>
                    </div>
                    {hasConfirmationDeadline && (
                      <input
                        type="datetime-local"
                        value={confirmationDeadline}
                        onChange={(e) => setConfirmationDeadline(e.target.value)}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Access Control Section */}
      <div className="bg-white rounded-lg shadow">
        <button
          type="button"
          className="w-full px-6 py-4 flex justify-between items-center text-left border-b border-gray-200"
          onClick={() => toggleSection('accessControl')}
        >
          <h3 className="text-xl font-medium text-gray-900">Access Control</h3>
          {openSections.accessControl ? (
            <ChevronUpIcon className="h-6 w-6 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-gray-500" />
          )}
        </button>

        {openSections.accessControl && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Access Type</label>
                <select
                  value={accessControlType}
                  onChange={(e) => setAccessControlType(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="invite">Invite Only</option>
                </select>
              </div>

              {accessControlType !== 'public' && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Points</label>
                    <input
                      type="number"
                      value={minPoints}
                      onChange={(e) => setMinPoints(e.target.value)}
                      min="0"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">VIP Spots</label>
                    <input
                      type="number"
                      value={vipSpots}
                      onChange={(e) => setVipSpots(e.target.value)}
                      min="0"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="bg-white rounded-lg shadow">
        <button
          type="button"
          className="w-full px-6 py-4 flex justify-between items-center text-left border-b border-gray-200"
          onClick={() => toggleSection('pricing')}
        >
          <h3 className="text-xl font-medium text-gray-900">Pricing</h3>
          {openSections.pricing ? (
            <ChevronUpIcon className="h-6 w-6 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-gray-500" />
          )}
        </button>

        {openSections.pricing && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Standard Price</label>
                <input
                  type="number"
                  value={standardPrice}
                  onChange={(e) => setStandardPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">VIP Price</label>
                <input
                  type="number"
                  value={vipPrice}
                  onChange={(e) => setVipPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Early Bird Price</label>
                <input
                  type="number"
                  value={earlyBirdPrice}
                  onChange={(e) => setEarlyBirdPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Early Bird Deadline</label>
                <input
                  type="datetime-local"
                  value={earlyBirdDeadline}
                  onChange={(e) => setEarlyBirdDeadline(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Perks Section */}
      <div className="bg-white rounded-lg shadow">
        <button
          type="button"
          className="w-full px-6 py-4 flex justify-between items-center text-left border-b border-gray-200"
          onClick={() => toggleSection('perks')}
        >
          <h3 className="text-xl font-medium text-gray-900">Perks</h3>
          {openSections.perks ? (
            <ChevronUpIcon className="h-6 w-6 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-gray-500" />
          )}
        </button>

        {openSections.perks && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Standard Perks</label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStandardPerk}
                      onChange={(e) => setNewStandardPerk(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a standard perk"
                    />
                    <button
                      type="button"
                      onClick={addStandardPerk}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {standardPerks.map((perk, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-md">
                        <span>{perk}</span>
                        <button
                          type="button"
                          onClick={() => removeStandardPerk(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">VIP Perks</label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVipPerk}
                      onChange={(e) => setNewVipPerk(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a VIP perk"
                    />
                    <button
                      type="button"
                      onClick={addVipPerk}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {vipPerks.map((perk, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-md">
                        <span>{perk}</span>
                        <button
                          type="button"
                          onClick={() => removeVipPerk(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 sticky bottom-0 bg-white py-4 px-6 border-t border-gray-200 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Save Event
        </button>
      </div>
    </form>
  );
};

export default EventForm; 