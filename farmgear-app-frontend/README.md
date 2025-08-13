# FarmGear App Frontend

🚜 **农业设备租赁平台前端应用**

FarmGear is a modern agricultural equipment rental platform built with React, connecting farmers with equipment providers for efficient farm gear sharing.

**🎯 Core Features**
- Equipment browsing and search
- User authentication and management  
- Rental order processing
- Provider dashboard for equipment listing
- Responsive design for all devices

**📊 Development Status**: Phase 2 Complete - Core Pages ✅

## 🔐 Authentication Mode

**HttpOnly Cookie Authentication** - Enhanced security implementation:
- ✅ HttpOnly Cookie for token storage (XSS protection)
- ✅ Frontend HTTP mode for development
- ✅ Backend HTTPS API requests
- ✅ Automatic cookie management by browser
- ❌ No localStorage token storage

## 🚀 Tech Stack

- **⚡ Vite** - Fast build tool and development server
- **⚛️ React 19** - Latest React with concurrent features
- **🔷 TypeScript** - Type-safe JavaScript development
- **🎨 Tailwind CSS** - Utility-first CSS framework
- **📦 Radix UI** - Unstyled, accessible UI components
- **🔧 Class Variance Authority** - For managing component variants
- **🎯 clsx & tailwind-merge** - For conditional CSS classes
- **🔐 Axios** - HTTP client with credential support

## 📁 Project Structure

```
src/
├── components/
│   └── ui/
│       ├── button.tsx          # Custom Button component
│       ├── button-variants.ts  # Button style variants
│       ├── dialog.tsx          # Dialog component
│       └── index.ts            # UI components exports
├── lib/
│   └── utils.ts               # Utility functions
├── App.tsx                    # Main application component
├── main.tsx                   # Application entry point
└── index.css                  # Global styles
```

## 🛠️ Development

### Install dependencies
```bash
npm install
```

### Start development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 🎨 UI Components

The project includes a set of reusable UI components built with Radix UI and styled with Tailwind CSS:

### Button Component
- Multiple variants: default, destructive, outline, secondary, ghost, link
- Multiple sizes: default, sm, lg, icon
- Built with class-variance-authority for type-safe variants

### Dialog Component
- Fully accessible modal dialog
- Smooth animations and transitions
- Keyboard navigation support
- Portal rendering for proper layering

## 📝 Code Style

- All webpage content is in English
- Code comments are written in Chinese
- Uses ESLint for code linting
- Follows React and TypeScript best practices

## 🔧 Configuration

- **TypeScript**: Configured with strict mode and path mapping
- **Tailwind CSS**: Configured with content paths for optimal builds
- **Vite**: Configured with path aliases for clean imports
- **ESLint**: Configured for React and TypeScript development

## 📚 Documentation

- **[Project Documentation](./docs/PROJECT_DOCUMENTATION.md)** - Complete project overview and architecture
- **[API Specification](./docs/API_SPECIFICATION.md)** - Backend API interface documentation
- **[Development Guide](./docs/API_DEVELOPMENT_GUIDE.md)** - Development workflow and guidelines
- **[Testing Guide](./docs/POSTMAN_TESTING_GUIDE.md)** - API testing with Postman

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Pages (Homepage, Auth, Dashboard, Equipment)
├── Components (Layout, UI, Business Logic)
├── Services (API Client, Authentication)
└── Utils (Helpers, Types, Constants)
```

## 🚧 Roadmap

- **Phase 1**: ✅ Foundation & Setup
- **Phase 2**: ✅ Core Pages & Layout  
- **Phase 3**: 🚧 Data Integration & API
- **Phase 4**: 📅 Business Logic & Features
- **Phase 5**: 📅 Optimization & Testing

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Write meaningful commit messages
3. Test your changes before submitting
4. Update documentation for new features

---

Built with ❤️ using modern React ecosystem
