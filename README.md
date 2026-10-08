# 🏗️ Structural Design Studio — Industrial Steel Roof Truss Design

> **Third Year Engineering (T.E.) Mini Project**  
> An interactive 3D structural analysis and Limit State Design studio for pitched steel roof trusses, purlins, built-up laced columns, and connections strictly compliant with **IS 800:2007**, **IS 875 (Parts 1, 2, 3)**, and **SP 6(1)**.

---

## 👥 Project Team & Key Contributions

### 1. Soham Vivekananda Phand
**Role:** Computational Mechanics & Structural FEA Lead  
* **Direct Stiffness Method Solver:** Formulated the 2D truss global stiffness matrix $[K]\{u\} = \{F\}$, transforming local element stiffness into global structural coordinates.
* **Boundary Conditions & Displacements:** Implemented static boundary restraints for pinned and roller supports to solve for global nodal joint deflections.
* **Internal Force Recovery:** Developed member axial force calculations, static equilibrium verification ($\sum F_x = 0, \sum F_y = 0$), and tension vs. compression categorization.

---

### 2. Ishwar Ganesh Rathod
**Role:** Concept-to-Visual Architect & IS 800 Design Engineer  
* **Concept-to-Visual Architecture:** Conceptualized the end-to-end workflow of transforming textbook handwritten calculations and classroom design notes into an interactive digital engineering studio.
* **Academic Solution Sheet UI:** Designed the step-by-step calculation cards, KaTeX LaTeX mathematical equation rendering, and authentic university workbook aesthetic.
* **IS 800:2007 Limit State Member Design:** Implemented code provisions for compression member capacity via the Perry-Robertson formula (Table 9c, Buckling Class $c$), tension tie net rupture ($T_{dn}$), and welded fillet joint connections.

---

### 3. Viraj Rajendra Saawant
**Role:** 3D WebGL Graphics Engine & Interactive CAD Architect  
* **Interactive 3D CAD Viewport:** Developed the real-time Three.js 3D structural visualizer featuring native orbit rotation, two-finger pinch zoom, and multi-touch pan gestures.
* **Parametric Building Assembler:** Engineered dynamic longitudinal frame replication across building length, rafter purlin lines, and lateral wind stability bracing systems.
* **Responsive CAD Interface:** Built draggable multi-pane layout resizers and dynamic 3D element selection highlighting with smooth camera framing.

---

### 4. Ayyan Yunus Sayyed
**Role:** Wind Engineering, Load Combinations & Purlin Design Lead  
* **IS 875 (Part 3): 2015 Wind Engine:** Formulated location-based wind speed calculations ($V_z = V_b \cdot k_1 \cdot k_2 \cdot k_3 \cdot k_4$), terrain multipliers, design wind pressure ($p_z$), and internal/external pressure coefficients ($C_{pe}, C_{pi}$).
* **Limit State Load Combinations:** Structured the critical design load combinations ($1.5DL+1.5LL$, $1.5DL+1.5WL$, $1.2DL+1.2LL+1.2WL$, and $0.9DL+1.5WL$ for wind uplift).
* **Channel Purlin Biaxial Bending:** Implemented IS 800 Clause 8.2 & 9.3.1 biaxial bending checks ($M_z, M_y$) on sloping roofs, interaction capacity ratios, and deflection limits ($L/180$).

---

## 📌 Executive Summary

**Structural Design Studio** is a comprehensive, browser-based engineering platform developed as a **Third Year Engineering (T.E.) Mini Project**. It bridges theoretical structural steel design with interactive computational analysis.

The system features a **dual-engine architecture**:
1. **Interactive 3D Finite Element Visualizer:** An interactive WebGL/Three.js CAD canvas providing real-time rendering of complete industrial sheds, multi-frame replication, purlin layout, axial tension/compression color-coding, load vectors, and deformed shape magnification.
2. **Academic Solution Sheet Engine:** A rigorous, textbook-grade step-by-step hand calculation generator powered by **KaTeX** LaTeX formatting. It delivers full mathematical derivations, variable substitutions, Free Body Diagrams (FBD), and code compliance checks matching university submission standards.

---

## 🏛️ Governing Indian Standard Codes

The analysis and design engines strictly implement standard Indian engineering practices:

* **IS 800:2007** — *General Construction in Steel — Code of Practice (Third Revision)*
  * Limit State Design (LSD) methodology.
  * Section 6: Design of Tension Members ($T_{dg}$, $T_{dn}$, $T_{db}$).
  * Section 7: Design of Compression Members (Perry-Robertson formula, Table 9(c) Buckling Class c, $f_{cd}$ evaluation).
  * Clause 7.6: Built-up Laced Columns ($2 \times \text{ISMC}$, spacing for $I_y \ge I_z$, transverse shear $V_t = 0.025 P$, lacing flat slenderness $\lambda \le 145$).
  * Section 8 & Clause 9.3.1: Purlin Design under biaxial bending ($M_z, M_y$) on sloping rafters and deflection check ($L/180$).
  * Section 10: Welded fillet connections ($f_{wd} = f_u / (\sqrt{3} \gamma_{mw})$) and bolted connections.
* **IS 875 (Part 1): 1987** — *Dead Loads for Buildings and Structures* (Roof sheeting, self-weight of members, purlins, and bracing).
* **IS 875 (Part 2): 1987** — *Imposed / Live Loads* (Pitched roofs with slope $\theta > 10^\circ$: $LL = 0.75 - 0.02(\theta - 10^\circ) \text{ kN/m}^2$, with minimum $0.40 \text{ kN/m}^2$).
* **IS 875 (Part 3): 2015** — *Wind Loads on Buildings and Structures*
  * Design wind speed: $V_z = V_b \cdot k_1 \cdot k_2 \cdot k_3 \cdot k_4$
  * Design wind pressure: $p_z = 0.6 \cdot V_z^2$
  * External ($C_{pe}$) and internal ($C_{pi}$) pressure coefficient distributions.
* **SP 6 (Part 1): 1964** — *ISI Handbook for Structural Engineers: Structural Steel Sections* (Section properties for Equal Angles ISA and Medium Channels ISMC).

---

## ✨ Key Features & Capabilities

### 1. 12 Pre-Configured Problem Groups (G1 to G12)
* Embedded database containing 12 authentic academic problem groups covering multiple Indian cities (Dhule, Bhopal, Raipur, Gaya, Nashik, Bangalore, Delhi, Satara, Hyderabad, Palghar, Beed).
* Automatically loads basic wind speed ($V_b$), terrain category (Cat 1 to Cat 4), truss configuration, span, height, building length, and roofing material (GI / AC sheet).

### 2. Parametric Structural Geometry
* Supported truss topologies: **Howe**, **Pratt**, **Fink**, and **Warren** roof trusses.
* Parametric controls: Span ($m$), Eave Height ($m$), Total Building Length ($m$), Bay Spacing ($m$), Number of Panels ($4$ to $16$), Roof Pitch/Slope ($0^\circ$ to $45^\circ$), and Eave Overhang ($m$).
* Automatic longitudinal frame replication across building length with interconnected purlin lines and base tie members.

### 3. Dual Finite Element & Analytical Solver
* **Direct Stiffness Method (FEA):** 2D truss stiffness matrix assembly ($[K]\{u\} = \{F\}$), solving for global joint displacements, support reactions (pin and roller supports), and member axial forces.
* **Method of Joints (Textbook Unit Load Engine):** Generates joint-by-joint equilibrium equations ($\sum F_x = 0, \sum F_y = 0$) and programmatic SVG Free Body Diagrams (FBDs) for Unit Gravity and Unit Wind cases.

### 4. Critical Design Load Combinations
Evaluates peak forces per IS 800:2007 Table 4 limit state load factors:
1. $1.5 \times (\text{Dead Load} + \text{Live Load})$
2. $1.5 \times (\text{Dead Load} + \text{Wind Load Uplift / Pressure})$
3. $1.2 \times (\text{Dead Load} + \text{Live Load} + \text{Wind Load})$
4. $0.9 \times \text{Dead Load} + 1.5 \times \text{Wind Load}$ *(Critical for wind uplift & stress reversal)*

### 5. Full Component Design Modules
* **Angle Struts & Ties:** Checks slenderness ratio $\lambda = KL/r$, compressive strength $f_{cd}$, gross yielding $T_{dg}$, and net rupture $T_{dn}$.
* **Channel Purlins:** Resolves loads perpendicular and parallel to roof sheets; checks biaxial bending capacity ratio $\left(\frac{M_z}{M_{dz}} + \frac{M_y}{M_{dy}}\right) \le 1.0$ and deflection.
* **Built-Up Laced Column:** Dual ISMC channels placed toe-to-toe or face-to-face; computes required spacing $s$ such that $I_y \ge I_z$; designs lacing flat bars with $2.5\%$ transverse shear.
* **Connection Details:** Fillet weld effective throat thickness $t_t = 0.7s$, weld length design, and minimum size checks per Table 21.

### 6. Interactive 3D WebGL Visualization
* Three.js OrbitControls: Smooth orbit, pan, and zoom.
* Real-time toggles for: 3D Perspective vs Orthographic 2D Views, Member Layers (Chords, Web Members, Purlins, Columns, Bracing), Load Vector Arrows, Stress Contours (Blue = Tension, Red = Compression), and Deformed Mesh.
* Member Inspector: Click any member in 3D to inspect its force, stress, section profile, and utilization ratio.

---

## 📁 Repository Structure

```
truss/
├── index.html                     # Primary single-page application entry point
├── css/                           # Modular stylesheet architecture
│   ├── base.css                   # CSS tokens, typography, dark theme variables
│   ├── layout.css                 # Grid system, resizable split-pane layout
│   ├── panels.css                 # Input controls, form fields, inspector widgets
│   └── study.css                  # Academic solution sheet & KaTeX paper styling
├── js/                            # Modular JavaScript architecture
│   ├── app.js                     # Main application orchestrator & event bindings
│   ├── state.js                   # Reactive state store for structural parameters
│   ├── data/
│   │   ├── groups.js              # Standard assignment problem groups (G1 to G12)
│   │   └── standards.js           # SP 6(1) steel tables (ISA, ISMC) & IS 875 wind tables
│   ├── engine/
│   │   ├── geometry.js            # Truss nodal coordinate & topology generators
│   │   ├── wind.js                # IS 875 Part 3 wind speed & pressure calculations
│   │   ├── solver.js              # Direct Stiffness Method FEA matrix solver
│   │   ├── code_is800.js          # IS 800:2007 Limit State equations & checks
│   │   ├── textbook.js            # Analytical Method of Joints & SVG FBD generator
│   │   ├── analysis.js            # Multi-load combination screening engine
│   │   └── scene.js               # Three.js 3D WebGL rendering, shaders & lighting
│   └── ui/
│       ├── resizer.js             # Draggable splitters for customizable panes
│       ├── inspector.js           # Member properties & code compliance sidebar
│       └── study.js               # Interactive step-by-step KaTeX solution sheet
├── test/
│   └── test_runner.js             # Automated test suite (32 verification benchmarks)
└── README.md                      # Comprehensive project documentation
```

---

## 🧮 8-Step Academic Design Workflow

The built-in **Workflow / Solution Sheet** tab produces an authentic, step-by-step calculation report:

```
[ Step 1: Design Data ] ──► [ Step 2: Geometry & Pitch ] ──► [ Step 3: IS 875 Load Intensities ]
                                                                       │
[ Step 6: Purlin Design ] ◄── [ Step 5: Member Capacity ] ◄── [ Step 4: Analysis & Combinations ]
         │
         ▼
[ Step 7: Laced Column ] ──► [ Step 8: Connections ]
```

1. **Step 1 · Design Data & Material Properties:** Yield stress $f_y$, ultimate tensile strength $f_u$, partial safety factors ($\gamma_{m0}=1.10$, $\gamma_{m1}=1.25$, $\gamma_{mw}=1.25$).
2. **Step 2 · Geometry & Panel Layout:** Rise-to-span ratio ($1/4$ to $1/6$), rafter pitch $\theta$, panel lengths, and purlin spacing.
3. **Step 3 · Load Calculations:** Dead load (cladding + purlins + truss self-weight), imposed load (reduction with slope), design wind speed $V_z$, design wind pressure $p_z$, and intermediate/ridge nodal load breakdown.
4. **Step 4 · Structural Analysis & Combinations:** Unit load joint equilibrium, Direct Stiffness FEA solver, and peak critical tension/compression force envelope.
5. **Step 5 · Truss Member Design:** Design of top chord (principal compression strut) via Perry-Robertson curve (IS 800 Table 9c) and bottom chord (principal tension tie) via net effective area.
6. **Step 6 · Purlin Biaxial Bending:** Sloping roof resolution ($W_z = W \cos\theta, W_y = W \sin\theta$), capacity interaction ratio, and live load deflection limits ($L/180$).
7. **Step 7 · Built-Up Laced Column:** Channel sizing ($2 \times \text{ISMC}$), center-to-center spacing $s$ ensuring $r_y \ge r_z$, column slenderness $\lambda_e = 1.05 \lambda$, and lacing flat design under $2.5\%$ transverse shear.
8. **Step 8 · Connection Design:** Fillet weld sizing, effective throat thickness ($0.7s$), and required weld length per side.

---

## 🧪 Verification & Testing Suite

The project includes an automated verification runner validating mathematical models directly against IS code formulas and published design benchmarks.

### Running the Tests
To execute the test suite, ensure [Node.js](https://nodejs.org/) is installed:

```bash
node test/test_runner.js
```

### Verification Results: **32 / 32 Passed (100%)**
* **Test 1 · Perry-Robertson $f_{cd}$:** Matches official IS 800:2007 Table 9(c) values within $\pm 0.3\%$ relative error across all slenderness values ($\lambda = 50, 80, 100, 130, 160$).
* **Test 2 · IS 875 Wind Pressures:** Verifies height factor $k_2$ interpolation, design wind speed $V_z$, and design wind pressure $p_z$.
* **Test 3 · Direct Stiffness FEA Solver:** Verifies global matrix non-singularity, support reaction equilibrium ($\sum R_y = P_{total}$, $R_x = 0$), and chord stress state.
* **Test 4 · Purlin Biaxial Bending:** Validates $M_{dz}, M_{dy}$, interaction equation, and deflection criteria.
* **Test 5 · Built-Up Column & Lacing:** Confirms required channel spacing ($I_y \ge I_z$), effective slenderness multiplier ($1.05$), and transverse shear ($V_t = 0.025 P$).
* **Test 6 · Connection Design:** Verifies fillet weld design strength $f_{wd} = 189.37 \text{ N/mm}^2$ and required weld length.
* **Test 7 · Screening Engine:** Confirms structural stability across all load combinations and multi-member utilization screening.

---

## 🚀 Getting Started & Execution

Because the application is written in standard vanilla modern JavaScript (ES6+), HTML5, and CSS3, it requires **no compilation or bundler step**:

### Option 1: Direct File Launch
Simply double-click or open [index.html](file:///Users/nikhilrathod/Downloads/truss/index.html) in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).

### Option 2: Local HTTP Server (Recommended)
Running through a local web server provides the best experience for module loading and performance:

Using Node.js `npx serve`:
```bash
npx serve .
```

Using Python:
```bash
# Python 3
python3 -m http.server 8000
```

Using VS Code:
Right-click [index.html](file:///Users/nikhilrathod/Downloads/truss/index.html) and select **Open with Live Server**.

Then navigate to `http://localhost:8000` or the port shown in your terminal.

---

## 🎮 3D Navigation & Controls

| Action | Mouse Control | Touch / Trackpad |
| :--- | :--- | :--- |
| **Rotate / Orbit** | Left Click + Drag | Single Finger Drag |
| **Pan** | Right Click + Drag | Two Finger Drag |
| **Zoom** | Mouse Scroll Wheel | Pinch In / Pinch Out |
| **Reset Camera** | Click `Reset` in top toolbar | Tap `Reset` button |
| **Fit to Model** | Click `Fit` in top toolbar | Tap `Fit` button |
| **Select Member** | Click on any truss line in 3D canvas | Tap member |

---

## 🛠️ Technology Stack

* **Front-End & UI:** Pure Vanilla HTML5, CSS3 (CSS Grid, Flexbox, CSS Custom Properties), JavaScript (ES6+).
* **3D Graphics Engine:** [Three.js](https://threejs.org/) (r128) with `OrbitControls`.
* **Mathematical Notation:** [KaTeX](https://katex.org/) (v0.16.9) for real-time LaTeX rendering.
* **Vector Diagrams:** Programmatic SVG generation for Joint Free Body Diagrams.
* **Testing:** Node.js CommonJS test harness.

---

## 📜 References

1. **Bureau of Indian Standards (BIS)** — *IS 800:2007: General Construction in Steel — Code of Practice*, New Delhi.
2. **Bureau of Indian Standards (BIS)** — *IS 875 (Parts 1, 2, 3): Design Loads (Other Than Earthquake) For Buildings And Structures*, New Delhi.
3. **Bureau of Indian Standards (BIS)** — *SP 6 (Part 1): 1964: ISI Handbook for Structural Engineers: Structural Steel Sections*, New Delhi.
4. **N. Subramanian** — *Design of Steel Structures (Limit State Method)*, Oxford University Press.
5. **S. K. Duggal** — *Limit State Design of Steel Structures*, McGraw-Hill Education.

---

## 🎓 Academic Disclaimer

This project is developed for educational and academic demonstration purposes as part of the **Third Year Engineering (T.E.)** curriculum. For real-world structural construction, designs must be validated and certified by a licensed Professional Structural Engineer.
