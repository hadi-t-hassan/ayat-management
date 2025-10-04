# Ayat Events Management System

A full-stack web application for managing Quran events with user authentication, event management, and dashboard analytics.

## 🏗️ Project Structure

```
ayat_app/
├── backend/                    # Django REST API Backend
│   ├── accounts/              # User management app
│   ├── events/                # Event management app
│   ├── quran_events_backend/  # Django project settings
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   └── db.sqlite3             # SQLite database
├── quran-event-orchestrator/  # React Frontend
│   ├── src/                   # Source code
│   ├── public/                # Static assets
│   ├── package.json           # Node.js dependencies
│   └── vite.config.ts         # Build configuration
└── venv/                      # Python virtual environment (ignored by Git)
```

## 🚀 Features

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Admin, User)
- Permission-based page access
- Secure login/logout

### **Event Management**
- Create, edit, delete events
- Event status management (Pending, Confirmed, Completed, Cancelled)
- Event participants tracking
- Event details with songs and dress information

### **User Management**
- User creation and editing
- Permission assignment
- Role management
- User profile management

### **Dashboard & Analytics**
- Event statistics
- Nearest event display
- Recent activity tracking
- User overview

### **Language Support**
- English and Arabic support
- RTL layout for Arabic
- Customizable translations
- Language settings page

### **Responsive Design**
- Mobile-friendly interface
- Modern UI with Shadcn components
- Tailwind CSS styling
- Optimized for all screen sizes

## 🛠️ Technology Stack

### **Backend**
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API framework
- **SQLite** - Database
- **JWT Authentication** - Token-based auth
- **CORS** - Cross-origin resource sharing

### **Frontend**
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Router** - Navigation
- **TanStack Query** - Data fetching

## 📦 Installation

### **Prerequisites**
- Python 3.8+
- Node.js 16+
- npm or yarn

### **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### **Frontend Setup**
```bash
# Navigate to frontend directory
cd quran-event-orchestrator

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🚀 Development

### **Backend Development**
```bash
cd backend
python manage.py runserver
```
Backend runs on `http://localhost:8000`

### **Frontend Development**
```bash
cd quran-event-orchestrator
npm run dev
```
Frontend runs on `http://localhost:8080`

### **Production Build**
```bash
cd quran-event-orchestrator
npm run build
```

## 📱 Usage

### **Admin Access**
1. Create superuser: `python manage.py createsuperuser`
2. Login with admin credentials
3. Access all features and user management

### **User Management**
- Create users with specific roles
- Assign permissions for page access
- Manage user profiles and settings

### **Event Management**
- Create events with detailed information
- Manage event participants
- Track event status and progress
- View event analytics

### **Language Settings**
- Switch between English and Arabic
- Customize translation values
- Manage language preferences

## 🔧 Configuration

### **Environment Variables**
Create `.env` file in backend directory:
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### **Database**
Default SQLite database is included. For production, configure PostgreSQL or MySQL.

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh token

### **Users**
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

### **Events**
- `GET /api/events/` - List events
- `POST /api/events/` - Create event
- `PUT /api/events/{id}/` - Update event
- `DELETE /api/events/{id}/` - Delete event

### **Dashboard**
- `GET /api/dashboard/` - Dashboard data

## 🚀 Deployment

### **Backend Deployment**
1. Configure production database
2. Set environment variables
3. Run migrations
4. Collect static files
5. Deploy to server

### **Frontend Deployment**
1. Build production bundle: `npm run build`
2. Deploy `dist/` folder to web server
3. Configure API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team.
