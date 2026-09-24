# Intent-Aware Interaction: Technical Framework

This document outlines the theoretical and technical framework for sophisticated human-computer interaction (HCI) within the Hue ecosystem, specifically for the DeskThing platform.

## 1. Touch Intention Systems
Touch intention is the practice of modeling human behavior to anticipate interactive needs before physical contact occurs.

- **Anticipatory UI**: The system transitions from "dormant" to "active" states based on presence sensing.
- **RF-Based Sensing (MotionAware)**: Beyond PIR, utilizing 2.4 GHz Zigbee signal fluctuations (RSSI) to detect human presence by signal attenuation (70% water body).
- **Z-Field Calibration**: Establishing a 3D volumetric field using at least 3-4 Hue bulbs to distinguish between humans and mechanical interference (fans, pets).

## 2. Gesture Recognition State Machines (GRSM)
A robust GRSM manages the lifecycle of touch sequences to ensure predictable behavior and conflict resolution.

### Basic States
- **Possible**: Default state. Recognizer is analyzing input.
- **Began**: Intent is recognized (e.g., beyond touch slop).
- **Changed**: Intermediate updates (e.g., slider movement).
- **Ended**: Successful completion.
- **Failed**: Touch sequence contradicted recognizer criteria.

### The Gesture Arena
A central disambiguation logic where competing recognizers enter to "win" a touch stream.
- **Disambiguation**: Horizontal vs. Vertical movement, Tap vs. Long-Press duration thresholds.
- **Pointer Capture**: Ensures events are received even if the pointer moves outside the element bounds.

## 3. Interaction Mathematics

### Euclidean Distance
Used for pinch-to-zoom intents.
$$D = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$

### Centroid Calculation
Used for multi-finger (3+) panning or global actions.
$$C_x = \frac{\sum x_i}{n}, \quad C_y = \frac{\sum y_i}{n}$$

### Angular Velocity
Used for rotation (e.g., color wheel adjustments).
$$\theta = \operatorname{atan2}(y_2 - y_1, x_2 - x_1)$$

## 4. Best Practices for DeskThing
- **Touch Slop**: 8-12px threshold to filter noise.
- **Interaction Velocity**: Decouple UI updates (60Hz) from network debouncing (100ms) for perceived responsiveness.
- **Thumb Zone**: Design for ergonomic "lever-like" movements on desk-mounted devices.
