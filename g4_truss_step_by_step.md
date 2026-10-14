# G4 Howe Roof Truss: Step-by-Step Solution (IS 875 / IS 800)

Sign convention: Tension (+), Compression (-). Units: kN, m, N/m2.
Trig: 26.57 deg -> cos 0.8944, sin 0.4472 | 45 deg -> 0.7071 | 56.31 deg -> cos 0.5547, sin 0.8321

## STEP 1: Given
Howe truss, span L = 16 m, length 98 m, eave height 12 m, Gaya (Vb = 39 m/s), AC sheet, 6 panels, Cpi = +-0.2.

## STEP 2: Geometry
| Item | Formula | Result |
|---|---|---|
| Rise (assumed L/4) | 16/4 | 4 m |
| Spacing (L/5 to L/3 = 3.2 to 5.33) | assumed | 4 m |
| Slope theta | atan(4/8) | 26.57 deg |
| Plan area | 16 x 4 | 64 m2 |
| Slope area | 64 / cos(26.57) | 71.56 m2 |
| Panel length (plan) | 16/6 | 2.667 m |
| Panel length (slope) | 2.667 / cos(26.57) | 2.981 m |

Joints: bottom L0..L6, top L0, U1, U2, U3 (peak), U4, U5, L6.
Diagonal angles: L1U2 = 45 deg (rise 2.667 over run 2.667), L2U3 = 56.31 deg (rise 4 over run 2.667).

## STEP 3: Dead Load
| Component | N/m2 |
|---|---|
| AC sheet | 180 |
| Purlins | 100 |
| Bracing | 20 |
| Truss self weight (L/3 + 5) x 10 | 103.33 |
| Total | 403.33 |

- Total DL = 403.33 x 64 = 25.81 kN
- Intermediate node = 25.81 / 6 = 4.30 kN
- End node = 4.30 / 2 = 2.15 kN

## STEP 4: Live Load (IS 875-2)
- theta > 10 deg: LL = 750 - 20(26.57 - 10) = 418.6 N/m2
- Truss reduction 2/3: 279.07 N/m2
- Total = 279.07 x 64 = 17.86 kN
- Intermediate node = 2.98 kN, end node = 1.49 kN

## STEP 5: Wind Load (IS 875-3)
1. Vz = 39 x 1.0 x 1.05 x 1.0 x 1.0 = 40.95 m/s
2. Pz = 0.6 x 40.95^2 = 1006.14 N/m2
3. Pd = 0.9 x 1.0 x 0.9 x 1006.14 = 814.97 N/m2
4. Uplift case: Cpe = -0.8, Cpi = +0.2, so (Cpe - Cpi) = -1.0
5. F = -1.0 x 71.56 x 814.97 = -58.32 kN (normal to roof, suction)
6. Intermediate node = -58.32 / 6 = -9.72 kN, end node = -4.86 kN

## STEP 6: Unit Load Analysis, Gravity (1 kN intermediate, 0.5 kN ends)
Reactions: R1 = R2 = (5 x 1 + 2 x 0.5)/2 = 3 kN

| Joint | Equations | Result |
|---|---|---|
| L0 | Fy: 3 - 0.5 + F(L0U1) sin26.57 = 0 | L0U1 = -5.59 |
| L0 | Fx: F(L0U1) cos26.57 + F(L0L1) = 0 | L0L1 = +5.00 |
| U1 | Fx: 0.8944 F(U1U2) + 5.00 = 0 | U1U2 = -5.59 |
| U1 | Fy: 2.5 + 0.4472 F(U1U2) - F(U1L1) - 1 = 0 | U1L1 = -1.00 |
| L1 | Fy: -1 + 0.7071 F(L1U2) = 0 | L1U2 = +1.41 |
| L1 | Fx: -5 + F(L1L2) + 0.7071(1.41) = 0 | L1L2 = +4.00 |
| U2 | Fx: 5 - 1 + 0.8944 F(U2U3) = 0 | U2U3 = -4.47 |
| U2 | Fy: 2.5 - 1 + 0.4472(-4.47) - F(U2L2) - 1 = 0 | U2L2 = -1.50 |
| L2 | Fy: -1.5 + 0.8321 F(L2U3) = 0 | L2U3 = +1.80 |
| L2 | Fx: -4 + F(L2L3) + 0.5547(1.80) = 0 | L2L3 = +3.00 |
| U3 | Fy: 2(0.4472 x 4.47) - 2(0.8321 x 1.80) - 1 - F(U3L3) = 0 | U3L3 = 0 |

Right half is the mirror image by symmetry.

## STEP 7: Unit Load Analysis, Wind (normal to roof, outward)
Unit force at left-slope node = (-0.4472, +0.8944) per kN.
Total uplift = 0.8944 x (2(0.5) + 5(1)) ... = 5.367 kN, so each support reaction = 2.683 kN downward. Horizontal reactions = 0 (symmetric).

| Joint | Equations | Result |
|---|---|---|
| L0 | Fy: -2.683 + 0.447 + 0.4472 F(L0U1) = 0 | L0U1 = +5.00 |
| L0 | Fx: -0.224 + 0.8944(5.00) + F(L0L1) = 0 | L0L1 = -4.25 |
| U1 | Fx: -0.447 - 4.472 + 0.8944 F(U1U2) = 0 | U1U2 = +5.50 |
| U1 | Fy: 0.894 - 2.236 + 0.4472(5.50) - F(U1L1) = 0 | U1L1 = +1.12 |
| L1 | Fy: 1.118 + 0.7071 F(L1U2) = 0 | L1U2 = -1.58 |
| L1 | Fx: 4.25 + F(L1L2) - 1.118 = 0 | L1L2 = -3.13 |
| U2 | Fx: -0.447 - 4.919 + 1.118 + 0.8944 F(U2U3) = 0 | U2U3 = +4.75 |
| U2 | Fy: 0.894 - 2.460 + 1.118 + 0.4472(4.75) - F(U2L2) = 0 | U2L2 = +1.68 |
| L2 | Fy: 1.68 + 0.8321 F(L2U3) = 0 | L2U3 = -2.01 |
| L2 | Fx: 3.13 + F(L2L3) + 0.5547(-2.01) = 0 | L2L3 = -2.01 |
| U3 | Fy check: -4.25 + 3.36 + 0.894 = 0 | U3L3 = 0 |

## STEP 8: Actual Member Forces
DL = unit grav x 4.30 | LL = unit grav x 2.98 | WL = unit wind x 9.72

| Member | Unit G | Unit W | DL | LL | WL |
|---|---|---|---|---|---|
| L0U1 | -5.59 | +5.00 | -24.04 | -16.66 | +48.60 |
| U1U2 | -5.59 | +5.50 | -24.04 | -16.66 | +53.46 |
| U2U3 | -4.47 | +4.75 | -19.22 | -13.32 | +46.17 |
| L0L1 | +5.00 | -4.25 | +21.50 | +14.90 | -41.31 |
| L1L2 | +4.00 | -3.13 | +17.20 | +11.92 | -30.42 |
| L2L3 | +3.00 | -2.01 | +12.90 | +8.94 | -19.54 |
| U1L1 | -1.00 | +1.12 | -4.30 | -2.98 | +10.89 |
| U2L2 | -1.50 | +1.68 | -6.45 | -4.47 | +16.33 |
| L1U2 | +1.41 | -1.58 | +6.06 | +4.20 | -15.36 |
| L2U3 | +1.80 | -2.01 | +7.74 | +5.36 | -19.54 |
| U3L3 | 0 | 0 | 0 | 0 | 0 |

## STEP 9: Load Combinations (IS 800:2007 Table 4)
C1 = 1.5(DL+LL) | C2 = 1.2(DL+LL+WL) | C3 = 1.5(DL+WL) | C4 = 0.9DL + 1.5WL (wind reversal)

| Member | C1 | C2 | C3 | C4 |
|---|---|---|---|---|
| L0U1 | -61.05 | +9.48 | +36.84 | +51.26 |
| U1U2 | -61.05 | +15.31 | +44.13 | +58.55 |
| U2U3 | -48.81 | +16.36 | +40.43 | +51.96 |
| L0L1 | +54.60 | -5.89 | -29.72 | -42.62 |
| L1L2 | +43.68 | -1.56 | -19.83 | -30.15 |
| L2L3 | +32.76 | +2.76 | -9.96 | -17.70 |
| U1L1 | -10.92 | +4.33 | +9.89 | +12.46 |
| U2L2 | -16.38 | +6.49 | +14.82 | +18.69 |
| L1U2 | +15.39 | -6.12 | -13.95 | -17.58 |
| L2U3 | +19.65 | -7.73 | -17.70 | -22.34 |

## STEP 10: Final Design Forces (max over C1 to C4)
| Member | Max Compression | Max Tension |
|---|---|---|
| L0U1 (top) | -61.05 | +51.26 |
| U1U2 (top) | -61.05 | +58.55 |
| U2U3 (top) | -48.81 | +51.96 |
| L0L1 (bottom) | -42.62 | +54.60 |
| L1L2 (bottom) | -30.15 | +43.68 |
| L2L3 (bottom) | -17.70 | +32.76 |
| U1L1 (vertical) | -10.92 | +12.46 |
| U2L2 (vertical) | -16.38 | +18.69 |
| L1U2 (diagonal) | -17.58 | +15.39 |
| L2U3 (diagonal) | -22.34 | +19.65 |
| U3L3 (vertical) | 0 (provide minimum section) | 0 |

Governing: top chord compression -61.05 kN (U1U2 tension +58.55). Bottom chord tension +54.60 kN, reverses to -42.62 kN under wind, so check slenderness for compression.

## STEP 11: Assumptions to State in the Answer
- Rise = L/4, spacing = 4 m, k2 = 1.05, Cpe = -0.8 on both slopes (conservative).
- DL and LL on plan area, wind on slope area.
- Wind reversal uses 0.9DL (IS 800 Table 4, DL helping stability).
