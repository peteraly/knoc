import React, { useState, useEffect } from 'react';
import LocationAutocomplete from './LocationAutocomplete';
import { useEvents } from '../contexts/EventContext';
import { ChevronDownIcon, ChevronUpIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const [neighborhood, setNeighborhood] = useState(initialData?.neighborhood || '');
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

  const [mediaFiles, setMediaFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coordinates) {
      alert('Please select a location from the suggestions');
      return;
    }
    if (!neighborhood) {
      alert('Please select a valid San Francisco address to determine the neighborhood');
      return;
    }
    
    // 1. Upload media files to Firebase Storage
    const uploadedMediaUrls = [];
    for (const media of mediaFiles) {
      const storageRef = ref(storage, `events/${uuidv4()}-${media.file.name}`);
      await uploadBytes(storageRef, media.file);
      const url = await getDownloadURL(storageRef);
      uploadedMediaUrls.push({ type: media.type, url });
    }

    // Build the event data object
    const eventData = {
      title,
      description,
      date,
      time,
      location,
      coordinates,
      neighborhood,
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
      hostingStyle,
      attendees: ['current-user'],
      media: uploadedMediaUrls,
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

  // Add neighborhoods array after categories (if not already imported from a shared constants file)
  const neighborhoods = [
    { id: 'downtown', name: 'Downtown', emoji: '🌆' },
    { id: 'mission', name: 'Mission District', emoji: '🎨' },
    { id: 'haight', name: 'Haight-Ashbury', emoji: '🌺' },
    { id: 'castro', name: 'Castro', emoji: '🌈' },
    { id: 'soma', name: 'SoMa', emoji: '��' },
    { id: 'marina', name: 'Marina', emoji: '⛵' },
    { id: 'richmond', name: 'Richmond', emoji: '🌊' },
    { id: 'sunset', name: 'Sunset', emoji: '🌅' },
    { id: 'nob-hill', name: 'Nob Hill', emoji: '⛰️' },
    { id: 'north-beach', name: 'North Beach', emoji: '🍝' },
    { id: 'other', name: 'Other Areas', emoji: '📌' }
  ];

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info Section: Always Open, Required Fields */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title *" required className="input" />
          <input value={date} onChange={e => setDate(e.target.value)} type="date" required className="input" />
          <input value={time} onChange={e => setTime(e.target.value)} type="time" required className="input" />
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  onCoordinatesChange={setCoordinates}
                  onNeighborhoodChange={setNeighborhood}
                  required
            className="input"
                />
          <select value={category} onChange={e => setCategory(e.target.value)} required className="input">
            {eventCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
            ))}
          </select>
          <input value={minAttendees} onChange={e => setMinAttendees(e.target.value)} type="number" min={1} required placeholder="Min Attendees *" className="input" />
          <input value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} type="number" min={1} required placeholder="Max Attendees *" className="input" />
          </div>
      </div>

      {/* Collapsible: More Details */}
      <div className="mb-4">
        <button type="button" onClick={() => toggleSection('details')} className="font-semibold flex items-center">
          More Details {openSections.details ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
        </button>
        {openSections.details && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="input" />
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="input">
              <option value="">Select Subcategory</option>
              {getSubcategories().map(sub => (
                <option key={sub.id} value={sub.id}>{sub.emoji} {sub.name}</option>
                  ))}
                </select>
            <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="Emoji" className="input" />
            <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="input">
              <option value="">Select Neighborhood</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>
                  ))}
                </select>
            <input value={groupMaxSize} onChange={e => setGroupMaxSize(e.target.value)} type="number" min={1} placeholder="Group Max Size" className="input" />
          </div>
        )}
      </div>

      {/* Collapsible: VIP & Access Control */}
      <div className="mb-4">
        <button type="button" onClick={() => toggleSection('accessControl')} className="font-semibold flex items-center">
          VIP & Access Control {openSections.accessControl ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
        </button>
        {openSections.accessControl && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        )}
      </div>

      {/* Collapsible: Pricing */}
      <div className="mb-4">
        <button type="button" onClick={() => toggleSection('pricing')} className="font-semibold flex items-center">
          Pricing {openSections.pricing ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
        </button>
        {openSections.pricing && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        )}
      </div>

      {/* Collapsible: Perks & Partner Info */}
      <div className="mb-4">
        <button type="button" onClick={() => toggleSection('perks')} className="font-semibold flex items-center">
          Perks & Partner Info {openSections.perks ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
        </button>
        {openSections.perks && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  type="button"
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

      {/* Submit/Cancel Buttons */}
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Create Event</button>
      </div>
    </form>
  );
};

export default EventForm; 