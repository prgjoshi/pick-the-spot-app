import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, Star, Utensils, Filter, Plus, Share2, Check, X, Heart, DollarSign } from 'lucide-react';

const PickTheSpotApp = () => {
  const [currentView, setCurrentView] = useState('home'); // home, create-group, join-group, group-session, recommendations
  const [user, setUser] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    cuisines: [],
    priceRange: [1, 4],
    maxDistance: 5,
    dietaryRestrictions: []
  });
  const [recommendations, setRecommendations] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({
    date: '',
    time: '',
    partySize: 2,
    location: ''
  });

  // Mock data
  const cuisineTypes = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'American', 'Thai', 'Indian', 'Mediterranean', 'French', 'Korean'
  ];
  
  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'
  ];

  const mockRestaurants = [
    {
      id: 1,
      name: "Bella Vista Italian",
      cuisine: "Italian",
      rating: 4.5,
      priceRange: 3,
      distance: 0.8,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
      address: "123 Main St",
      phone: "(555) 123-4567",
      availability: true,
      groupScore: 92,
      reasoning: "Perfect match for Italian lovers, accommodates dietary restrictions"
    },
    {
      id: 2,
      name: "Spice Garden Thai",
      cuisine: "Thai",
      rating: 4.3,
      priceRange: 2,
      distance: 1.2,
      image: "https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400&h=300&fit=crop",
      address: "456 Oak Ave",
      phone: "(555) 234-5678",
      availability: true,
      groupScore: 87,
      reasoning: "Great balance of flavors, budget-friendly option"
    },
    {
      id: 3,
      name: "Tokyo Sushi Bar",
      cuisine: "Japanese",
      rating: 4.7,
      priceRange: 4,
      distance: 2.1,
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
      address: "789 Pine St",
      phone: "(555) 345-6789",
      availability: false,
      groupScore: 78,
      reasoning: "High quality but limited availability"
    }
  ];

  // Simulate user login
  useEffect(() => {
    setUser({ id: 1, name: 'John Doe', email: 'john@example.com' });
  }, []);

  // Mock recommendation algorithm
  const generateRecommendations = () => {
    const scored = mockRestaurants.map(restaurant => ({
      ...restaurant,
      groupScore: Math.floor(Math.random() * 30) + 70 // 70-100 score
    })).sort((a, b) => b.groupScore - a.groupScore);
    
    setRecommendations(scored);
  };

  const createGroup = (groupName) => {
    const newGroup = {
      id: Date.now(),
      name: groupName,
      creatorId: user.id,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date()
    };
    setCurrentGroup(newGroup);
    setGroupMembers([{ ...user, isCreator: true }]);
    setCurrentView('group-session');
  };

  const joinGroup = (inviteCode) => {
    // Mock joining group
    const mockGroup = {
      id: Date.now(),
      name: 'Food Lovers Unite',
      creatorId: 2,
      inviteCode: inviteCode,
      createdAt: new Date()
    };
    setCurrentGroup(mockGroup);
    setGroupMembers([
      { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', isCreator: true },
      { ...user, isCreator: false }
    ]);
    setCurrentView('group-session');
  };

  const startRecommendationSession = () => {
    generateRecommendations();
    setCurrentView('recommendations');
  };

  const renderPriceRange = (range) => {
    return '$'.repeat(range) + '$'.repeat(4 - range).replace(/\$/g, '○');
  };

  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Pick the Spot</h1>
          <p className="text-lg text-gray-600 mb-8">
            End the "where should we eat?" debate forever. Get personalized restaurant recommendations for your group.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentView('create-group')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Create Group
            </button>
            <button
              onClick={() => setCurrentView('join-group')}
              className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-3 rounded-lg font-semibold border-2 border-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Join Group
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-orange-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Group Preferences</h3>
            <p className="text-gray-600">Collect everyone's dining preferences and dietary restrictions in one place.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Star className="text-orange-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Scoring</h3>
            <p className="text-gray-600">AI-powered algorithm finds restaurants that satisfy everyone's preferences.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Clock className="text-orange-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
            <p className="text-gray-600">Check availability and make reservations directly through the app.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const CreateGroupView = () => {
    const [groupName, setGroupName] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
        <div className="container mx-auto px-4 max-w-md">
          <button
            onClick={() => setCurrentView('home')}
            className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Create New Group</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Date Night, Team Lunch"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => createGroup(groupName)}
                disabled={!groupName.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const JoinGroupView = () => {
    const [inviteCode, setInviteCode] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
        <div className="container mx-auto px-4 max-w-md">
          <button
            onClick={() => setCurrentView('home')}
            className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Join Group</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-2xl font-mono"
                  maxLength={6}
                />
              </div>
              
              <button
                onClick={() => joinGroup(inviteCode)}
                disabled={inviteCode.length !== 6}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Join Group
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const GroupSessionView = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{currentGroup?.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Share2 size={16} />
              Invite Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{currentGroup?.inviteCode}</span>
            </div>
          </div>

          {/* Group Members */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Group Members ({groupMembers.length})</h3>
            <div className="space-y-2">
              {groupMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <span className="font-medium">{member.name}</span>
                  {member.isCreator && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Creator</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Session Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Dining Session Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={sessionDetails.date}
                  onChange={(e) => setSessionDetails({...sessionDetails, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={sessionDetails.time}
                  onChange={(e) => setSessionDetails({...sessionDetails, time: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                <select
                  value={sessionDetails.partySize}
                  onChange={(e) => setSessionDetails({...sessionDetails, partySize: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {[2,3,4,5,6,7,8,9,10].map(size => (
                    <option key={size} value={size}>{size} people</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={sessionDetails.location}
                  onChange={(e) => setSessionDetails({...sessionDetails, location: e.target.value})}
                  placeholder="City or address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Preferences</h3>
            
            <div className="space-y-6">
              {/* Cuisine Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Cuisines</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {cuisineTypes.map(cuisine => (
                    <button
                      key={cuisine}
                      onClick={() => {
                        setUserPreferences(prev => ({
                          ...prev,
                          cuisines: prev.cuisines.includes(cuisine)
                            ? prev.cuisines.filter(c => c !== cuisine)
                            : [...prev.cuisines, cuisine]
                        }));
                      }}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        userPreferences.cuisines.includes(cuisine)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                <div className="flex gap-2">
                  {[1,2,3,4].map(price => (
                    <button
                      key={price}
                      onClick={() => setUserPreferences(prev => ({...prev, priceRange: [1, price]}))}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        userPreferences.priceRange[1] >= price
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {renderPriceRange(price)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Restrictions</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {dietaryOptions.map(dietary => (
                    <button
                      key={dietary}
                      onClick={() => {
                        setUserPreferences(prev => ({
                          ...prev,
                          dietaryRestrictions: prev.dietaryRestrictions.includes(dietary)
                            ? prev.dietaryRestrictions.filter(d => d !== dietary)
                            : [...prev.dietaryRestrictions, dietary]
                        }));
                      }}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        userPreferences.dietaryRestrictions.includes(dietary)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {dietary}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={startRecommendationSession}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Restaurant Recommendations
          </button>
        </div>
      </div>
    </div>
  );

  const RecommendationsView = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Restaurant Recommendations</h2>
            <button
              onClick={() => setCurrentView('group-session')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Group
            </button>
          </div>

          <div className="mb-6 p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Session:</strong> {currentGroup?.name} • {sessionDetails.date} at {sessionDetails.time} • {sessionDetails.partySize} people
            </p>
          </div>

          <div className="space-y-6">
            {recommendations.map((restaurant, index) => (
              <div key={restaurant.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-6">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold">{restaurant.name}</h3>
                        <p className="text-gray-600">{restaurant.cuisine} • {restaurant.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-500 mb-1">
                          {restaurant.groupScore}%
                        </div>
                        <div className="text-sm text-gray-500">Group Match</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400" size={16} fill="currentColor" />
                        <span className="font-medium">{restaurant.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="text-green-500" size={16} />
                        <span>{renderPriceRange(restaurant.priceRange)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="text-gray-400" size={16} />
                        <span>{restaurant.distance} mi</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        restaurant.availability
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {restaurant.availability ? 'Available' : 'Fully Booked'}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{restaurant.reasoning}</p>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        View Details
                      </button>
                      {restaurant.availability && (
                        <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                          Make Reservation
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recommendations.length === 0 && (
            <div className="text-center py-12">
              <Utensils className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">No recommendations yet. Complete your group preferences to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'create-group':
        return <CreateGroupView />;
      case 'join-group':
        return <JoinGroupView />;
      case 'group-session':
        return <GroupSessionView />;
      case 'recommendations':
        return <RecommendationsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="app">
      {renderCurrentView()}
    </div>
  );
};

export default PickTheSpotApp;