# AgriCon1.2

The AgriCon dashboard, runnable two ways: in a browser (for development, and
for demoing right here on this PC), or as an installed Android app (for
carrying it into the field on a phone). Both talk to the same real backend —
nothing here is mocked or duplicated, the Android build just wraps the same
web app in a native shell.

## Quickest start: one command, one window

```bat
run_app.bat
```

This builds the frontend and starts the backend, which now also serves that
build — one process, one port, nothing else to open. Once it prints
"Application startup complete", go to **http://localhost:8000** (or, from a
phone on the same Wi-Fi, this PC's LAN IP with `:8000`, printed when it
starts). Changed the frontend? Just re-run `run_app.bat` — it rebuilds every
time.

This is the easiest path for demos and for just trying the app. For active
frontend development, use the two-terminal workflow below instead — it gives
you hot reload, which `run_app.bat` doesn't (it serves a static build).

## Want a public URL instead of localhost?

See `DEPLOY.md` — same Dockerfile powers a free Render deployment.

## Development workflow (hot reload, two terminals)

### 1. Start the backend

```bat
backend\run_backend.bat
```

This prints the PC's LAN IP address(es) when it starts — note one down if
you're about to run the Android app on a phone, you'll need it below.
Details on the API and the model itself: `backend/README.md`.

### 2. Run the frontend in a browser

```bat
npm run dev
```

Open the printed `localhost` URL. The dev server proxies `/api` to the
backend on `:8000`, so nothing else to configure. (Both this and
`backend\run_backend.bat` can run at the same time as `run_app.bat` above —
they're on different ports, :3000 vs :8000 — but there's rarely a reason to
run both modes at once.)

## Run as an Android app

This uses [Capacitor](https://capacitorjs.com) to package the same React app
as a real installable `.apk` — same UI, same diagnosis pipeline, just running
in a native window instead of a browser tab, with an icon on the home screen.

**One-time setup, if you don't already have it:** install
[Android Studio](https://developer.android.com/studio) (it bundles the
Android SDK and JDK the build needs). This project's `android/` folder is
already generated and configured — you're opening it, not creating it.

**Every time you change the frontend code**, rebuild the web app and copy it
into the native project before building the `.apk`:

```bat
npm run build
npx cap sync android
```

(`sync` = `copy` (web assets) + `update` (regenerates the Capacitor-managed Gradle
files: `capacitor.settings.gradle`, `android/app/capacitor.build.gradle`, and the
`capacitor-cordova-android-plugins` folder). Those three are build tool output,
not hand-edited source — if the `android/` folder is ever moved, re-zipped, or
checked out fresh and Gradle complains one of them is missing, re-running this
command regenerates them.)

**Then, in Android Studio:**

1. `File > Open`, select the `android` folder inside `AgriCon1.2`.
2. Let Gradle sync finish (first time only — it downloads a few things, needs
   internet).
3. Plug in a phone (USB debugging on) or start an emulator, then hit **Run**.
   Or, to just produce an installable file: `Build > Build App Bundle(s) /
   APK(s) > Build APK(s)`, then install the `.apk` it points you to.

**Backend address on the phone:** the packaged app has no dev-server proxy,
so unlike the browser version it doesn't know where the backend is by
default. The first time a diagnosis screen can't reach it, it shows a
"Backend address" field — enter this PC's LAN IP + `:8000`
(`run_backend.bat` prints it), e.g. `http://192.168.1.23:8000`. The phone and
this PC need to be on the same Wi-Fi network. It's saved on the phone after
that, so this is a one-time step unless the PC's IP changes.

**App identity**, if you want to change it: `capacitor.config.ts` has the
app's id and display name; `android/app/src/main/res/values/strings.xml` has
the name shown under the icon. The launcher icon is Capacitor's default for
now — swap `android/app/src/main/res/mipmap-*/ic_launcher*.png` for a real
one, or use `npx @capacitor/assets generate` with a source logo.

## What's what

```
src/               the app (unchanged whether it runs in a browser or as the Android app)
backend/           the diagnosis API — see backend/README.md
android/           the generated native Android project (opened in Android Studio, not hand-edited)
capacitor.config.ts   app id / name / which folder (dist/) gets packaged
```
