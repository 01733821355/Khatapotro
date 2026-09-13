import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Heart, 
  Footprints, 
  Clock, 
  Check, 
  Watch, 
  Smartphone, 
  Zap, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import type { Language, CalorieUserProfile, CalorieActivityLog } from '../types';

interface LiveActivityTrackerProps {
  calorieProfile?: CalorieUserProfile;
  onAddActivityLog: (log: Omit<CalorieActivityLog, 'id' | 'syncedToSheets'>) => void;
  selectedDate: string;
  language: Language;
}

export const LiveActivityTracker: React.FC<LiveActivityTrackerProps> = ({
  calorieProfile,
  onAddActivityLog,
  selectedDate,
  language,
}) => {
  const userWeight = calorieProfile?.weightKg || 68;

  // Mode: 'sensor' (লাইভ মোশন সেন্সর) vs 'health_app' (স্মার্টওয়াচ / হেলথ অ্যাপ সিঙ্ক)
  const [trackerMode, setTrackerMode] = useState<'sensor' | 'health_app'>('sensor');

  // --- 1. Real-time Device Step Sensor State ---
  const [isSensorRunning, setIsSensorRunning] = useState(false);
  const [liveSteps, setLiveSteps] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [sensorActivityType, setSensorActivityType] = useState<'walking' | 'running'>('walking');
  const [sensorSensitivity, setSensorSensitivity] = useState<'high' | 'normal' | 'low'>('high');
  const [sensorSupported, setSensorSupported] = useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPulsingStep, setIsPulsingStep] = useState(false);

  // References for motion detection
  const gravityEmaRef = useRef<number>(9.8);
  const isAbovePeakRef = useRef<boolean>(false);
  const lastStepTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);
  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);

  // --- 2. Health App Quick Importer State ---
  const [healthSteps, setHealthSteps] = useState<string>('5000');
  const [healthDuration, setHealthDuration] = useState<string>('30');
  const [healthHeartRate, setHealthHeartRate] = useState<string>('78');
  const [healthType, setHealthType] = useState<'walking' | 'running' | 'cycling' | 'sitting'>('walking');
  const [syncSavedToast, setSyncSavedToast] = useState(false);

  // Calorie calculation formulas
  // Walking MET ~ 3.8, Running MET ~ 8.0, Cycling ~ 6.5, Sitting/Sedentary ~ 1.3
  const getMet = (type: string) => {
    switch (type) {
      case 'running': return 8.0;
      case 'cycling': return 6.8;
      case 'sitting': return 1.3;
      default: return 3.8; // walking
    }
  };

  // Sensor calculations
  const sensorStride = sensorActivityType === 'running' ? 0.95 : 0.76; // meters per step
  const sensorDistanceKm = Math.round((liveSteps * sensorStride) / 10) / 100; // km
  // Calorie burn based on weight and activity
  const sensorCalBurned = Math.round(
    (sensorActivityType === 'running' ? 0.075 : 0.045) * liveSteps * (userWeight / 70)
  );

  // Timer effect for sensor active duration
  useEffect(() => {
    if (isSensorRunning) {
      timerRef.current = setInterval(() => {
        setActiveSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSensorRunning]);

  // Threshold calculation based on sensitivity and activity mode
  const getStepThreshold = () => {
    let base = sensorActivityType === 'running' ? 1.6 : 0.95;
    if (sensorSensitivity === 'high') base *= 0.75; // e.g. 0.71 for walking
    if (sensorSensitivity === 'low') base *= 1.4;   // e.g. 1.33 for walking
    return base;
  };

  // Manual test step increment
  const handleSimulateStep = () => {
    setLiveSteps((prev) => prev + 1);
    setIsPulsingStep(true);
    setTimeout(() => setIsPulsingStep(false), 200);
  };

  // Handle Motion Sensor Event with peak detection over dynamic acceleration
  const handleDeviceMotion = (event: DeviceMotionEvent) => {
    // Prefer acceleration (gravity-isolated) if valid, otherwise use accelerationIncludingGravity with EMA filter
    const directAcc = event.acceleration;
    const gravAcc = event.accelerationIncludingGravity;

    let dynamicDelta = 0;

    if (
      directAcc &&
      directAcc.x !== null &&
      directAcc.y !== null &&
      directAcc.z !== null &&
      (Math.abs(directAcc.x) > 0.01 || Math.abs(directAcc.y) > 0.01 || Math.abs(directAcc.z) > 0.01)
    ) {
      // Direct linear acceleration without gravity
      dynamicDelta = Math.sqrt(
        directAcc.x * directAcc.x + directAcc.y * directAcc.y + directAcc.z * directAcc.z
      );
    } else if (gravAcc && gravAcc.x !== null && gravAcc.y !== null && gravAcc.z !== null) {
      // Total acceleration including 9.8m/s² gravity
      const totalMag = Math.sqrt(
        gravAcc.x * gravAcc.x + gravAcc.y * gravAcc.y + gravAcc.z * gravAcc.z
      );

      // Smooth gravity baseline with Exponential Moving Average (EMA)
      gravityEmaRef.current = gravityEmaRef.current * 0.92 + totalMag * 0.08;
      dynamicDelta = Math.abs(totalMag - gravityEmaRef.current);
    } else {
      return;
    }

    const threshold = getStepThreshold();
    const now = Date.now();
    const minStepIntervalMs = sensorActivityType === 'running' ? 240 : 280;

    // Peak detection state machine: must cross above threshold and reset
    if (dynamicDelta > threshold) {
      if (!isAbovePeakRef.current && now - lastStepTimeRef.current > minStepIntervalMs) {
        lastStepTimeRef.current = now;
        isAbovePeakRef.current = true;
        setLiveSteps((prev) => prev + 1);
        setIsPulsingStep(true);
        setTimeout(() => setIsPulsingStep(false), 200);
      }
    } else if (dynamicDelta < threshold * 0.6) {
      // Reset peak when wave falls back down
      isAbovePeakRef.current = false;
    }
  };

  // Keep motion handler reference updated
  useEffect(() => {
    motionHandlerRef.current = handleDeviceMotion;
  });

  // Start or Stop Sensor with permission handling for iOS 13+ & modern Android
  const toggleSensor = async () => {
    if (isSensorRunning) {
      setIsSensorRunning(false);
      if (motionHandlerRef.current) {
        window.removeEventListener('devicemotion', motionHandlerRef.current);
      }
      return;
    }

    // Check device motion support
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      // iOS 13+ requires explicit permission request
      const devMotion = DeviceMotionEvent as any;
      if (typeof devMotion.requestPermission === 'function') {
        try {
          const permission = await devMotion.requestPermission();
          if (permission !== 'granted') {
            setPermissionDenied(true);
            return;
          }
        } catch (err) {
          console.warn('Device motion permission error:', err);
          setPermissionDenied(true);
          return;
        }
      }

      setSensorSupported(true);
      setIsSensorRunning(true);
      gravityEmaRef.current = 9.8;
      isAbovePeakRef.current = false;

      const listener = (e: DeviceMotionEvent) => {
        if (motionHandlerRef.current) {
          motionHandlerRef.current(e);
        }
      };
      window.addEventListener('devicemotion', listener);
    } else {
      setSensorSupported(false);
    }
  };

  const handleResetSensor = () => {
    setIsSensorRunning(false);
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
    }
    setLiveSteps(0);
    setActiveSeconds(0);
    isAbovePeakRef.current = false;
  };

  // Save Sensor result to today's activity log
  const handleSaveSensorActivity = () => {
    if (liveSteps < 10 && activeSeconds < 10) return;

    const actName = language === 'bn' 
      ? `লাইভ ${sensorActivityType === 'running' ? 'দৌড়ানো' : 'হাঁটা'} (${liveSteps.toLocaleString()} পা)` 
      : `Live ${sensorActivityType === 'running' ? 'Running' : 'Walking'} (${liveSteps} steps)`;

    onAddActivityLog({
      date: selectedDate,
      activityName: actName,
      durationMinutes: Math.max(1, Math.round(activeSeconds / 60)),
      caloriesBurned: Math.max(1, sensorCalBurned),
      intensity: sensorActivityType === 'running' ? 'vigorous' : 'moderate',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    handleResetSensor();
    setSyncSavedToast(true);
    setTimeout(() => setSyncSavedToast(false), 3000);
  };

  // Health App / Smartwatch calculation
  const calcHealthCalories = () => {
    const durMins = Number(healthDuration) || 30;
    const met = getMet(healthType);
    // Formula: MET * 3.5 * weightKg / 200 * durationMinutes
    const baseCal = Math.round(met * userWeight * (durMins / 60));
    
    // Heart rate bonus adjustment (if above normal resting rate >80)
    const hr = Number(healthHeartRate) || 0;
    const hrMultiplier = hr > 110 ? 1.25 : hr > 90 ? 1.1 : 1.0;
    return Math.round(baseCal * hrMultiplier);
  };

  const handleSaveHealthAppActivity = () => {
    const stepsNum = Number(healthSteps) || 0;
    const durMins = Number(healthDuration) || 30;
    const hrNum = Number(healthHeartRate) || 0;
    const cal = calcHealthCalories();

    const typeTitle = healthType === 'running' 
      ? (language === 'bn' ? 'দৌড়' : 'Running')
      : healthType === 'cycling'
      ? (language === 'bn' ? 'সাইক্লিং' : 'Cycling')
      : healthType === 'sitting'
      ? (language === 'bn' ? 'বসে থাকা/অ্যাক্টিভ' : 'Sedentary/Active')
      : (language === 'bn' ? 'হাঁটা' : 'Walking');

    const activityLabel = language === 'bn'
      ? `হেলথ অ্যাপ: ${typeTitle} ${stepsNum > 0 ? `(${stepsNum.toLocaleString()} স্টেপ)` : ''} ${hrNum > 0 ? `[HR: ${hrNum} bpm]` : ''}`
      : `Health App: ${typeTitle} ${stepsNum > 0 ? `(${stepsNum} steps)` : ''} ${hrNum > 0 ? `[HR: ${hrNum} bpm]` : ''}`;

    onAddActivityLog({
      date: selectedDate,
      activityName: activityLabel.trim(),
      durationMinutes: durMins,
      caloriesBurned: cal,
      intensity: healthType === 'running' ? 'vigorous' : 'moderate',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setSyncSavedToast(true);
    setTimeout(() => setSyncSavedToast(false), 3000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4 mb-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <span>{language === 'bn' ? 'লাইভ স্টেপ ও স্পোর্টস অ্যাক্টিভিটি ট্র্যাকার' : 'Live Step & Sports Activity Tracker'}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? 'হাঁটা, দৌড়, স্মার্টওয়াচ ও মোবাইল ফিটনেস অ্যাপ ডেটা' : 'Device sensor steps & smartwatch fitness sync'}
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTrackerMode('sensor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              trackerMode === 'sensor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-500" />
            <span>{language === 'bn' ? 'মোশন সেন্সর' : 'Live Sensor'}</span>
          </button>
          <button
            type="button"
            onClick={() => setTrackerMode('health_app')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              trackerMode === 'health_app'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Watch className="w-3.5 h-3.5 text-blue-500" />
            <span>{language === 'bn' ? 'হেলথ অ্যাপ সিঙ্ক' : 'Health App'}</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {syncSavedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'অ্যাক্টিভিটি ও ক্যালরি বার্ন সফলভাবে যুক্ত হয়েছে!' : 'Activity & burned calories logged successfully!'}</span>
          </div>
        </div>
      )}

      {/* MODE 1: LIVE DEVICE MOTION SENSOR */}
      {trackerMode === 'sensor' && (
        <div className="space-y-4">
          {permissionDenied && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {language === 'bn'
                  ? 'মোবাইল মোশন সেন্সর পারমিশন প্রয়োজন। ব্রাউজার সেটিংসে সেন্সর অ্যাক্সেস নিশ্চিত করুন।'
                  : 'Device motion sensor permission is required. Please allow access in browser settings.'}
              </span>
            </div>
          )}

          {/* Sensor Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Steps */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              isPulsingStep ? 'bg-rose-50 border-rose-300 scale-102' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">{language === 'bn' ? 'স্টেপ কাউন্ট' : 'Steps'}</span>
                <Footprints className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {liveSteps.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'bn' ? 'লাইভ পদক্ষেপ' : 'Footsteps'}
              </span>
            </div>

            {/* Distance */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">{language === 'bn' ? 'দূরত্ব' : 'Distance'}</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {sensorDistanceKm} <span className="text-xs font-semibold text-slate-500">km</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'bn' ? 'মোট দূরত্ব' : 'Traveled'}
              </span>
            </div>

            {/* Duration */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">{language === 'bn' ? 'সময়' : 'Duration'}</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatTimer(activeSeconds)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'bn' ? 'মিনিট : সেকেন্ড' : 'mm : ss'}
              </span>
            </div>

            {/* Calories Burned */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center justify-between text-rose-600 mb-1">
                <span className="text-[11px] font-bold">{language === 'bn' ? 'বার্ন ক্যালরি' : 'Burned'}</span>
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600">
                {sensorCalBurned} <span className="text-xs font-semibold text-rose-500">kcal</span>
              </div>
              <span className="text-[10px] text-rose-400 font-medium">
                {language === 'bn' ? 'শরীরের ওজনের ভিত্তিতে' : `${userWeight}kg basis`}
              </span>
            </div>
          </div>

          {/* Activity Type & Sensitivity Switcher */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Activity Mode */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span>{language === 'bn' ? 'মোড:' : 'Mode:'}</span>
                <button
                  type="button"
                  onClick={() => setSensorActivityType('walking')}
                  className={`px-2.5 py-1 rounded-xl border text-xs transition-all cursor-pointer ${
                    sensorActivityType === 'walking'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {language === 'bn' ? 'হাঁটা (Walking)' : 'Walking'}
                </button>
                <button
                  type="button"
                  onClick={() => setSensorActivityType('running')}
                  className={`px-2.5 py-1 rounded-xl border text-xs transition-all cursor-pointer ${
                    sensorActivityType === 'running'
                      ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {language === 'bn' ? 'দৌড়ানো (Running)' : 'Running'}
                </button>
              </div>

              {/* Sensitivity Mode */}
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                <span className="text-[11px] text-slate-400">{language === 'bn' ? 'সেন্সর সংবেদনশীলতা:' : 'Sensitivity:'}</span>
                <button
                  type="button"
                  onClick={() => setSensorSensitivity('high')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    sensorSensitivity === 'high'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={language === 'bn' ? 'হালকা নাড়াচাড়াতেও স্টেপ কাউন্ট হবে (পকেট বা হাতে)' : 'High sensitivity for gentle movement'}
                >
                  {language === 'bn' ? 'উচ্চ (High)' : 'High'}
                </button>
                <button
                  type="button"
                  onClick={() => setSensorSensitivity('normal')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    sensorSensitivity === 'normal'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {language === 'bn' ? 'স্বাভাবিক' : 'Normal'}
                </button>
              </div>
            </div>

            {/* Sensor Control Buttons & Manual Step Simulator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateStep}
                className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                title={language === 'bn' ? 'কম্পিউটার বা টেস্টের জন্য এক ক্লিক পদক্ষেপ যোগ' : 'Tap to test 1 step manually'}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? '+১ পা টেস্ট' : '+1 Step Test'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetSensor}
                disabled={liveSteps === 0 && activeSeconds === 0}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleSensor}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                  isSensorRunning
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 animate-pulse'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                }`}
              >
                {isSensorRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>{language === 'bn' ? 'পজ করুন' : 'Pause'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{language === 'bn' ? 'লাইভ ট্র্যাকিং শুরু' : 'Start Sensor'}</span>
                  </>
                )}
              </button>

              {(liveSteps > 0 || activeSeconds > 10) && (
                <button
                  type="button"
                  onClick={handleSaveSensorActivity}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'bn' ? 'লগ করুন' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: HEALTH APP / SMARTWATCH QUICK IMPORTER */}
      {trackerMode === 'health_app' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">
                {language === 'bn' ? 'গুগল ফিট / স্মার্টওয়াচ / মোবাইল হেলথ অ্যাপ ইন্টিগ্রেশন' : 'Google Fit & Smartwatch Data Sync'}
              </p>
              <p className="text-blue-700 leading-relaxed">
                {language === 'bn'
                  ? 'আপনার ফোন বা স্মার্টওয়াচের ফিটনেস অ্যাপ (যেমন Google Fit, Samsung Health, Mi Fitness) থেকে আজকের স্টেপ, অ্যাক্টিভ সময় বা হার্ট রেট লিখে এক ক্লিকে ক্যালরি বার্ন হিসাবে যোগ করুন।'
                  : 'Input steps, active minutes, and average heart rate from your phone or smartwatch app for precise MET calorie burn calculation.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Activity Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'ব্যায়ামের ধরন' : 'Exercise Type'}
              </label>
              <select
                value={healthType}
                onChange={(e) => setHealthType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="walking">{language === 'bn' ? 'হাঁটা (Walking)' : 'Walking'}</option>
                <option value="running">{language === 'bn' ? 'দৌড় (Running)' : 'Running'}</option>
                <option value="cycling">{language === 'bn' ? 'সাইক্লিং (Cycling)' : 'Cycling'}</option>
                <option value="sitting">{language === 'bn' ? 'অ্যাক্টিভ সময় (Active Time)' : 'Active Time'}</option>
              </select>
            </div>

            {/* Steps */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'স্টেপ সংখ্যা (পা)' : 'Step Count'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={healthSteps}
                  onChange={(e) => setHealthSteps(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Footprints className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Duration Minutes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'সময়কাল (মিনিট)' : 'Duration (mins)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={healthDuration}
                  onChange={(e) => setHealthDuration(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Heart Rate */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'গড় হার্ট রেট (BPM)' : 'Avg Heart Rate (BPM)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={healthHeartRate}
                  onChange={(e) => setHealthHeartRate(e.target.value)}
                  placeholder="76"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Heart className="w-3.5 h-3.5 text-rose-500 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                {language === 'bn' ? 'আনুমানিক ক্যালরি বার্ন:' : 'Estimated Calorie Burn:'}
              </span>
              <div className="flex items-center gap-1 text-rose-600 font-extrabold text-base">
                <Flame className="w-4 h-4 fill-rose-500" />
                <span>{calcHealthCalories()} kcal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveHealthAppActivity}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'bn' ? 'আজকের ডায়েরিতে যুক্ত করুন' : 'Log to Today\'s Burn'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
