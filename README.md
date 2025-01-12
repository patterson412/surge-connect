# SurgeConnect

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/)

A full-stack social media application developed as part of the Surge Global internship applicant selection assignment. The project implements core social media features with a modern tech stack and clean architecture.

## 🚀 Technologies

### Frontend
- **Next.js** - React framework
- **TailwindCSS** - CSS framework
- **ShadCN** - UI component library
- **MagicUI** - Modern UI components
- **Lucide React** - icons

### Backend
- **Java SpringBoot** - Enterprise-grade backend framework
- **Maven** - Dependency management
- **JPA** with PostgreSQL - Data persistence
- **AWS S3** - Static asset storage for user posts and profile pictures
- **Caffeine** - High-performance caching for image URLs

## ✨ Features

### Core Functionality
- **Authentication**
  - Secure user registration and login system
  - JWT token-based authentication using HTTP-only cookies
  - Logout functionality

### Social Features
- **Posts Management**
  - Create, update caption, and delete posts
  - Like and comment on posts
  - Post ranking based on engagement metrics
  - Save posts for later viewing
  - Nested comment system with reply functionality

### User Experience
- **Profile System**
  - Personalized user profiles
  - Dynamic routing via username (`/[username]`)
  - Private saved posts section
  - Grid view of posts with hover overlay showing engagement metrics
  - Post preview modal

### Technical Features
- **Responsive Design**
  - Fully optimized for all devices (mobile to desktop)
- **Performance**
  - Efficient image caching system
  - Optimized database queries

## 🛠️ Deployment

- **Containerization**
  - Dockerized application for consistent environments
- **CI/CD**
  - GitHub Actions workflow with automated unit testing for backend

## 🔜 Planned Features

The following features were architected but not implemented due to time constraints:

- reCAPTCHA integration for enhanced security
- Comment deletion system (backend ready)
- Post image update functionality
- User search functionality
- Dark mode (foundation laid with nextThemes)

## 🚀 Getting Started

### Prerequisites
- Docker
- PostgreSQL
- AWS Account with S3 access

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/surge-connect.git
cd surge-connect
```
2. Configure environment variables
```bash
# Create application.properties in backend/src/main/resources
cp application-ci.properties application.properties

# Update with your credentials:
# - Database connection
# - AWS credentials
# - JWT secret

```
3. Start with Docker
```bash
docker-compose up --build
```

The application should now be running at `http://localhost:3000`


## 🤝 Acknowledgments

- Surge Global for the experience