# GoiHunt

<p align="center">
  <strong>Turn the world around you into a Japanese vocabulary learning environment.</strong>
</p>

<p align="center">
  An interactive Japanese vocabulary learning web app powered by computer vision and gamification.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TensorFlow.js-FF6F00?style=flat&logo=tensorflow&logoColor=white" alt="TensorFlow.js" />
</p>

<p align="center">
  <a href="#demo">Demo</a> •
  <a href="#features">Features</a> •
  <a href="#machine-learning">Machine Learning</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#research">Research</a>
</p>

---

## What is GoiHunt?

**GoiHunt** is an interactive Japanese vocabulary learning application that uses **computer vision** to connect everyday objects with their corresponding Japanese vocabulary.

Users can point their camera at an object, and GoiHunt identifies it using an image classification model. The application then presents the corresponding Japanese vocabulary, reading, and Indonesian meaning.

The recognition experience is combined with **gamification** to make vocabulary discovery more engaging and encourage continued learning.

```text
Camera → Object Recognition → Japanese Vocabulary → Learn → Earn XP → Gamification
```

---
 
## Demo
 
> Point the camera at an everyday object and discover its Japanese vocabulary.
 
https://github.com/user-attachments/assets/e33168ea-3e61-4f51-ad99-c684e8d5825f
 
<table>
  <tr>
    <td align="center" width="20%">
      <img src="https://github.com/user-attachments/assets/41abb498-6692-4f9c-b544-538ef215ebe1" width="160" alt="Scan" /><br />
      <sub><strong>Scan</strong></sub>
    </td>
    <td align="center" width="20%">
      <img src="https://github.com/user-attachments/assets/fdd04126-5604-4c37-bab0-b5171d984063" width="160" alt="Vocab" /><br />
      <sub><strong>Vocab</strong></sub>
    </td>
    <td align="center" width="20%">
      <img src="https://github.com/user-attachments/assets/8567520a-f7aa-4fa3-9261-07312f105655" width="160" alt="Quiz" /><br />
      <sub><strong>Quiz</strong></sub>
    </td>
    <td align="center" width="20%">
      <img src="https://github.com/user-attachments/assets/e7426265-dce9-4b8f-95a9-5d36945beccc" width="160" alt="Collection" /><br />
      <sub><strong>Collection</strong></sub>
    </td>
    <td align="center" width="20%">
      <img src="https://github.com/user-attachments/assets/794b4510-717c-473c-b62c-8aad0024d517" width="160" alt="Gamification" /><br />
      <sub><strong>Gamification</strong></sub>
    </td>
  </tr>
</table>
---

## Features

| Feature               | Description                                             |
| ---------------------- | -------------------------------------------------------- |
| Camera Recognition    | Recognize supported objects using the device camera     |
| Japanese Vocabulary   | View Japanese writing, reading, and Indonesian meaning   |
| Vocabulary Collection | Collect vocabulary discovered through recognition       |
| XP & Level            | Earn experience and progress through levels              |
| Missions              | Complete learning objectives and earn rewards             |
| Achievements          | Unlock achievements through milestones                    |
| Leaderboard           | Compare progress with other learners                      |
| Quiz                  | Reinforce vocabulary through interactive quizzes          |
| Authentication        | Secure user registration and authentication               |

---

## Machine Learning

GoiHunt uses **MobileNetV2** with **transfer learning** for image classification, trained to recognize **10 object classes**:

```text
ac · buku · jam · kacamata · kursi · laptop
meja · sepatu · tas · topi
```

### Model Architecture

```text
Input Image (224×224×3)
      │
      ▼
MobileNetV2 (ImageNet weights)
      │
      ▼
Global Average Pooling
      │
      ▼
Dense → Softmax
      │
      ▼
10 Classes
```

### Training Configuration

| Parameter          | Value                              |
| ------------------- | ------------------------------------ |
| Pretrained Weights  | ImageNet                             |
| Input Size          | 224 × 224                            |
| Optimizer           | Adam (lr = 0.001)                    |
| Loss                | Sparse Categorical Crossentropy      |
| Batch Size          | 32                                    |
| Maximum Epochs      | 20 (early stopping, patience = 3)    |

The model uses image augmentation and fine-tuning before being converted for **TensorFlow.js** inference.

**Test Accuracy: 96.69%**

---

## Architecture

```text
┌──────────────────────────────┐
│          React App           │
│  Camera • Learning • Game    │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌──────────────┐  ┌────────────────┐
│ TensorFlow.js│  │   REST API     │
│ Object Model │  │ Node + Express │
└──────────────┘  └───────┬────────┘
                          ▼
                  ┌────────────────┐
                  │   PostgreSQL   │
                  └────────────────┘
```

Client-side ML inference handles object recognition, while the backend manages application data, authentication, learning progress, gamification, and other business logic.

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-username/goihunt.git && cd goihunt

# 2. Install
cd frontend && npm install
cd ../backend && npm install

# 3. Run — in two separate terminals
cd frontend && npm run dev
cd backend && npm run dev
```

> Set up `.env` files for both `frontend/` and `backend/` before running.

---

## Research

GoiHunt was developed as an undergraduate informatics thesis project.

The GitHub repository focuses on the **application, implementation, machine learning pipeline, and technical development** of GoiHunt.
For the **research methodology, dataset methodology, experimental results, learning evaluation, and detailed discussion**, please refer to:

* **Publication:** [Skripsi GoiHunt](http://repository.upnvj.ac.id/id/eprint/39781)
---

<p align="center">
  <strong>GoiHunt</strong><br>
  Learn Japanese from what you see.
</p>
