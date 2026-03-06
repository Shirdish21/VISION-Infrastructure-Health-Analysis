# VISION – Smart Infrastructure Monitoring System

## 🚀 Project Overview

VISION (Virtual Infrastructure Surveillance & Intelligence Optimization Network) is a Smart City Infrastructure Monitoring Platform that evaluates the operational condition of urban infrastructure assets using rule-based intelligence and AI-driven analytics.

The system monitors bridges, roads, pipelines, transformers, streetlights, and utilities, detects abnormal conditions, classifies asset health states, and presents insights through dashboards, maps, and analytics.

---

## 🎯 Key Objectives

* Monitor infrastructure assets in real time
* Detect abnormal operational conditions using rules and AI
* Classify asset health states automatically
* Visualize infrastructure health using dashboards and maps
* Assist administrators in maintenance planning and decision-making

---

## 🧠 Core Features

### Monitoring Layer

* Real-time infrastructure health dashboard
* Rule-based threshold monitoring
* Sensor data simulation
* Infrastructure utilization tracking
* Capacity vs usage comparison

### Intelligence Layer

* Automated health score calculation (0–100)
* AI anomaly detection
* AI health prediction
* Risk heatmap visualization
* Automated priority scoring

### Operations Layer

* Smart alert & notification system
* Automated work order generator
* Maintenance workflow tracking

### Visualization Layer

* Interactive city map with asset pins
* Color-coded health indicators
* Smart asset pin icons by type
* Historical data analytics
* Infrastructure analytics dashboard
* Zone-based monitoring

### Citizen Services

* Citizen issue reporting with photo and location

---

## 🏗️ System Architecture

### 1. Presentation Layer (Frontend)

* Web-based responsive user interface
* Dashboard views for administrators
* Map visualization for infrastructure assets
* Forms for asset management and reporting

### 2. Application Layer (Logic Engine)

* Rule-based monitoring engine
* Health score calculation engine
* Anomaly detection module
* Alert generation system
* Filtering and sorting engine

### 3. Data Layer (Backend)

* Cloud database for asset storage
* Sensor data storage
* Historical records
* User and admin data

### 4. Integration Layer

* Map services integration
* Firebase cloud services
* Real-time database synchronization

---

## 🗂️ Project Structure

```
VISION/
│
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── map.html
│   ├── analytics.html
│   └── assets.html
│
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── styles/
│
├── firebase.json
├── firestore.rules
├── package.json
└── README.md
```

---

## ⚙️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6+)
* Responsive UI Design

### Backend & Cloud

* Firebase Authentication
* Firebase Firestore Database
* Firebase Hosting

### Mapping & Visualization

* Interactive Map API
* Chart & Graph Libraries

### Intelligence

* Rule-based Monitoring Engine
* AI/ML Prediction Models

---

## 📦 Dependencies Required

Install the following dependencies to run the project on another machine:

### 1. Node.js

* Version: 16 or above

### 2. NPM Packages

```
npm install firebase
npm install chart.js
npm install leaflet
```

### 3. Firebase CLI

```
npm install -g firebase-tools
```

---

## 🔥 Firebase Setup

1. Create a Firebase Project
2. Enable Firestore Database
3. Enable Firebase Authentication
4. Enable Firebase Hosting
5. Add Web App to Firebase Project
6. Copy Firebase Config to project

---

## ▶️ How to Run the Project Locally

### Step 1: Clone Repository

```
git clone <repository-url>
cd VISION
```

### Step 2: Install Dependencies

```
npm install
```

### Step 3: Add Firebase Config

* Open firebaseConfig.js
* Paste your Firebase project credentials

### Step 4: Run Local Server

```
firebase serve
```

---

## 🌍 Deployment

Deploy using Firebase Hosting:

```
firebase deploy
```

---

## 🧪 Demo Capabilities

* Add infrastructure assets
* Map-based asset visualization
* Real-time health monitoring
* Automated health scoring
* Alert generation
* Historical analytics
* Risk zone identification

---

## 📊 Health Classification Logic

| Health Score | Status   |
| ------------ | -------- |
| 80–100       | Optimal  |
| 50–79        | Warning  |
| 0–49         | Critical |

---

## 🔐 User Roles

* **Admin** – Monitor assets, analytics, maintenance
* **Operator** – Manage infrastructure data
* **Citizen** – Report infrastructure issues

---

## 🧩 Future Enhancements

* Predictive maintenance
* Digital twin infrastructure
* AI root cause analysis
* Emergency simulation mode
* AI image-based damage detection
* AI infrastructure planning assistant

---

## 🏆 Hackathon Evaluation Readiness

This project is structured to meet judging criteria:

* Working functional prototype
* Modular architecture
* Clean UI/UX
* Real-time monitoring
* AI-driven intelligence
* Clear documentation

---

## 👨‍💻 Author

Developed as part of Smart City Infrastructure Intelligence Hackathon.

---

## 📜 License

This project is developed for academic and hackathon purposes.
