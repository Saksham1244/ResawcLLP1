import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckSquare, Circle, Play, MoreVertical } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { fetchAPI, globalUser } from '@/utils/api';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!globalUser) return;
    const fetchTasks = async () => {
      setLoading(true);
      const res = await fetchAPI(`/tasks?userId=${globalUser.id}&role=${globalUser.role}`);
      if (res.success) {
        setTasks(res.data);
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tasks</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
        ) : tasks.map((task: any) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskLeft}>
              {task.status === 'COMPLETED' ? (
                <CheckSquare color="#10b981" size={24} />
              ) : task.status === 'IN_PROGRESS' ? (
                <Play color="#6366f1" size={24} />
              ) : (
                <Circle color="#cbd5e1" size={24} />
              )}
            </View>
            <View style={styles.taskMiddle}>
              <Text style={[styles.taskTitle, task.status === 'COMPLETED' && styles.taskDone]}>
                {task.title}
              </Text>
              <Text style={styles.taskSub}>
                {task.dueDate ? `Due ${task.dueDate}` : 'TBD'}
              </Text>
              <View style={[
                styles.badge, 
                task.priority?.toUpperCase() === 'HIGH' ? styles.badgeHigh : 
                task.priority?.toUpperCase() === 'MEDIUM' ? styles.badgeMedium : styles.badgeLow
              ]}>
                <Text style={[
                  styles.badgeText,
                  task.priority?.toUpperCase() === 'HIGH' ? styles.badgeTextHigh : 
                  task.priority?.toUpperCase() === 'MEDIUM' ? styles.badgeTextMedium : styles.badgeTextLow
                ]}>{task.priority || 'Medium'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.taskRight}>
              <MoreVertical color="#cbd5e1" size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  filterBtn: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  taskLeft: {
    marginRight: 15,
    justifyContent: 'center',
  },
  taskMiddle: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeHigh: { backgroundColor: 'rgba(239,68,68,0.1)' },
  badgeTextHigh: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  badgeMedium: { backgroundColor: 'rgba(245,158,11,0.1)' },
  badgeTextMedium: { color: '#d97706', fontSize: 11, fontWeight: '700' },
  badgeLow: { backgroundColor: 'rgba(16,185,129,0.1)' },
  badgeTextLow: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  taskRight: {
    justifyContent: 'center',
    paddingLeft: 10,
  }
});
