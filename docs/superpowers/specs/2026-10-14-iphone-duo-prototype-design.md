# iPhone Duo prototype design

## Outcome

Add an iPhone Duo preview to the guest-app prototype. Presenters can switch
between the existing iPhone view and iPhone Duo, then preview Duo with its
outer display closed or inner display open.

## Interaction

- Add a **Device** tab to Prototype controls.
- Keep the existing iPhone preview as the default.
- Let the presenter select **iPhone Duo** and choose **Closed** or **Open**.
- Preserve the active screen, booking, and other prototype state when the
  presenter changes the device or pose.
- Derive the preview frame from the display proportions in Apple’s technical
  specifications: 1398 × 2034 for the outer display and 2670 × 1878 for the
  open inner display. Scale the frame to fit the available browser area rather
  than treating those pixel dimensions as CSS pixels.
- In the open pose, make the guest app use the wider layout, keep controls
  available in a vertical navigation rail, and leave the center fold region
  visually clear of primary controls.

## Architecture

`GuestAppPrototype` owns the preview selection as presentation state.
`PrototypeControls` receives the current device and pose plus callbacks to
change them. The existing guest-app tree renders once, so changing the preview
does not create a second app state or reset the current flow. CSS on the
existing `.guest-device` frame controls the selected proportions and the
open-pose fold treatment.

The preview models the app viewport and fold layout. It does not emulate iOS
system UI or device sensors.

## Accessibility and success criteria

- Use labelled native controls for device and pose selection.
- Keep the active selection visible and operable by keyboard and touch.
- Confirm the selected screen and booking remain unchanged when switching
  iPhone, Duo Closed, and Duo Open.
- Confirm the closed preview keeps the existing compact layout and the open
  preview uses the wider layout without covering key content or controls at
  the fold.

## Reference

- [iPhone Duo technical specifications](https://www.apple.com/iphone-duo/specs/)
- [Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
