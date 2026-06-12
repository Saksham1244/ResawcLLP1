import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { checkGeofence, GeofenceResult } from '@/services/locationService';
import { MapPin, Clock, CalendarCheck, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { fetchAPI, globalUser } from '@/utils/api';

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [geofence, setGeofence] = useState<GeofenceResult | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState("");

  useEffect(() => {
    refreshLocation();
    checkExistingAttendance();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkExistingAttendance = async () => {
    if (!globalUser?.id) return;
    const d = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    try {
      const res = await fetchAPI(`/attendance?start=${todayStr}&end=${todayStr}&userId=${globalUser.id}`);
      if (res.success && res.data && res.data.length > 0) {
        const todayRecord = res.data[0];
        setIsCheckedIn(true);
        setCheckInTime(todayRecord.mobileLoginTime || todayRecord.systemLoginTime || todayRecord.timeIn);
      }
    } catch (e) {
      console.log('Error fetching attendance', e);
    }
  };

  const refreshLocation = async () => {
    setLoading(true);
    const result = await checkGeofence();
    setGeofence(result);
    setLoading(false);
  };

  const handleToggle = async () => {
    if (!geofence) return;
    
    if (!isCheckedIn) {
      if (!geofence.isAllowed && globalUser?.role?.toUpperCase() !== 'ADMIN') {
        Alert.alert("Check-in Failed", `You are ${geofence.distance}m away from the office. You must be within 100m to check in.`);
        return;
      }
      
      const timeNow = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const d = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Hit live API to mark mobile checkin
      const res = await fetchAPI('/attendance', {
        method: 'POST',
        body: JSON.stringify({ userId: globalUser?.id, date: todayStr, timeIn: timeNow, source: 'mobile' })
      });

      if (res.success) {
        setIsCheckedIn(true);
        setCheckInTime(timeNow);
        Alert.alert("Success", "You are checked in via Mobile App!");
      } else {
        Alert.alert("Error", "Failed to connect to the database.");
      }
    } else {
      const timeNow = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const d = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Hit live API to mark mobile checkout
      const res = await fetchAPI('/attendance', {
        method: 'POST',
        body: JSON.stringify({ userId: globalUser?.id, date: todayStr, timeIn: timeNow, source: 'checkout' })
      });

      if (res.success) {
        setIsCheckedIn(false);
        Alert.alert("Success", "You are checked out!");
      } else {
        Alert.alert("Error", "Failed to connect to the database.");
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>Mark your daily attendance</Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Clock size={32} color="#6366f1" />
        </View>
        <Text style={styles.time}>{currentTime || "--:--:--"}</Text>
        
        <View style={styles.locationContainer}>
          <MapPin size={16} color="#64748b" />
          <Text style={styles.locationText}>South Extension Part 1, New Delhi</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statusBox}>
            {geofence?.error ? (
              <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 10 }}>{geofence.error}</Text>
            ) : globalUser?.role?.toUpperCase() === 'ADMIN' ? (
              <View style={[styles.allowedBox, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <CheckCircle2 size={16} color="#6366f1" />
                <Text style={[styles.allowedText, { color: '#6366f1' }]}>Admin Geofence Bypass Active</Text>
              </View>
            ) : geofence?.isAllowed ? (
              <View style={styles.allowedBox}>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={styles.allowedText}>Within office radius ({geofence.distance}m)</Text>
              </View>
            ) : (
              <View style={styles.deniedBox}>
                <AlertTriangle size={16} color="#f59e0b" />
                <Text style={styles.deniedText}>Too far from office ({geofence?.distance}m)</Text>
              </View>
            )}
            
            <TouchableOpacity onPress={refreshLocation}>
              <Text style={styles.refreshText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCheckedIn ? (
          <View style={{ width: '100%' }}>
            <View style={styles.checkedInStatus}>
              <CheckCircle2 size={18} color="#10b981" />
              <Text style={styles.checkedInText}>Checked In at {checkInTime}</Text>
            </View>
            <TouchableOpacity style={styles.checkOutButton} onPress={handleToggle}>
              <Text style={styles.buttonText}>Check Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.checkInButton, (!geofence?.isAllowed && globalUser?.role?.toUpperCase() !== 'ADMIN' || loading) && styles.disabledButton]} 
            onPress={handleToggle}
            disabled={(!geofence?.isAllowed && globalUser?.role?.toUpperCase() !== 'ADMIN') || loading}
          >
            <Text style={styles.buttonText}>Mark Check In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  time: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 25,
  },
  locationText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBox: {
    width: '100%',
    marginBottom: 25,
    alignItems: 'center',
  },
  allowedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  allowedText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 13,
  },
  deniedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  deniedText: {
    color: '#d97706',
    fontWeight: '600',
    fontSize: 13,
  },
  refreshText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 13,
  },
  checkInButton: {
    width: '100%',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkOutButton: {
    width: '100%',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkedInStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  checkedInText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 15,
  }
});
