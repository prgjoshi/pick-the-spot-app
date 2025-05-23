# Pick the Spot 🍽️

An AI-powered restaurant recommendation app that helps groups decide where to eat based on individual dining preferences.

![Pick the Spot Screenshot](https://via.placeholder.com/800x400/FF6B35/FFFFFF?text=Pick+the+Spot+App)

## Features

- **Group Management**: Create and join dining groups with unique invite codes
- **Preference Collection**: Gather individual cuisine, price, and dietary preferences
- **Smart Recommendations**: AI-powered scoring algorithm finds restaurants that satisfy everyone
- **Reservation Integration**: Check availability and book tables directly
- **Real-time Updates**: Live group member updates and preference synchronization

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context/useState
- **Deployment**: Ready for Vercel/Netlify

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
bash
git clone https://github.com/YOUR_USERNAME/pick-the-spot-app.git
cd pick-the-spot-app

2. Install dependencies:

bashnpm install

Start the development server:

bashnpm start

Open http://localhost:3000 to view it in the browser.

Usage
Creating a Group

Click "Create Group" on the home page
Enter a group name (e.g., "Date Night", "Team Lunch")
Share the generated invite code with your group members

Joining a Group

Click "Join Group" on the home page
Enter the 6-character invite code
Add your dining preferences

Getting Recommendations

Set your session details (date, time, party size, location)
Select your preferred cuisines and dietary restrictions
Set your price range preference
Click "Get Restaurant Recommendations"
View scored recommendations with booking options

Features in Detail
Preference System

Cuisines: Italian, Mexican, Chinese, Japanese, American, Thai, Indian, Mediterranean, French, Korean
Price Range: $ to $$$$ with visual indicators
Dietary Restrictions: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Halal, Kosher

Recommendation Algorithm

Group compatibility scoring (70-100%)
Distance and availability factors
Price range matching
Dietary restriction accommodation
Reasoning explanations for each suggestion

Project Structure
pick-the-spot-app/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── App.js (main component)
│   │   └── index.js
│   ├── styles/
│   │   └── index.css
│   └── index.js
├── package.json
├── tailwind.config.js
└── README.md
Future Enhancements

 Backend API integration
 User authentication and profiles
 Real restaurant data (Google Places, Yelp APIs)
 Actual reservation booking (OpenTable, Resy APIs)
 Push notifications
 Group chat functionality
 Advanced filtering options
 Machine learning preference optimization
 Mobile app version

Contributing

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details.
Contact
Your Name - your.email@example.com
Project Link: https://github.com/YOUR_USERNAME/pick-the-spot-app

Made with ❤️ for food lovers everywhere
