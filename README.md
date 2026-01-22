
# 📊 Water Footprint Calculator

A web-based application that helps users estimate their personal **water footprint** by tracking daily water usage and calculating total consumption. This project includes a frontend interface, a backend server, and a local database to store user data.

---

## 📌 Features

* 🌍 Calculates water footprint based on user inputs
* 🧮 Stores water usage records in a database
* 💧 User-friendly web interface
* 🛠️ Built with HTML, JavaScript, and Node.js
* 📦 Includes local SQLite database (`water_usage.db`)

---

## 📁 Project Structure

```
WaterFootprint_Calculator/
├── Arduino_IDE/              # Hardware related code
├── index.html                # Frontend UI
├── script.js                 # Frontend interaction logic
├── server.js                 # Backend server
├── water_usage.db            # SQLite database for user data
└── README.md                
```

---

## 🧠 How It Works

1. User opens the web interface (`index.html`).
2. They input water usage values for different categories (e.g., bathing, laundry, drinking, etc.).
3. The interface sends this data to the backend (`server.js`).
4. Server stores inputs into the SQLite database (`water_usage.db`).
5. The application calculates the total water footprint and displays results to the user.

---

## 🚀 Installation

### 🔧 Requirements

* **Node.js** (v14 or higher)
* **npm** (comes with Node.js)

---

### 💻 Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/Lakshmirishitha/WaterFootprint_Calculator.git
cd WaterFootprint_Calculator
```

2. **Install dependencies**



```bash
npm install
```

3. **Start the server**

```bash
node server.js
```

4. **Open the app in a browser**

Visit:

```
http://localhost:3000
```



## 🧩 Usage

1. Open the web interface.
2. Enter water usage details.
3. Click **Calculate**.
4. View your estimated water footprint.

---

## 🗃️ Database

```
water_usage.db
```

## 📦 Built With

| Technology | Purpose             |
| ---------- | ------------------- |
| HTML/CSS   | Frontend UI         |
| JavaScript | Client interactions |
| Node.js    | Backend server      |
| SQLite     | Local database      |

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Please follow a clear code style and include tests where appropriate.

---

## 📬 Contact

Created by **Lakshmirishitha** — feel free to reach out if you have questions or ideas!
GitHub: [https://github.com/Lakshmirishitha](https://github.com/Lakshmirishitha)

