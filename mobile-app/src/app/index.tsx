import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckSquare, TrendingUp, Users, ArrowRight, ShieldAlert, LogOut, Play, Circle } from 'lucide-react-native';
import { globalUser, logout, fetchAPI } from '@/utils/api';
import { useState, useEffect } from 'react';

export default function HomeScreen() {
  const [stats, setStats] = useState({ activeLeads: 0, pendingTasks: 0 });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!globalUser) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [overviewRes, leadsRes, tasksRes] = await Promise.all([
          fetchAPI(`/overview?userId=${globalUser.id}&role=${globalUser.role}`),
          globalUser.role.toLowerCase() !== 'editor' ? fetchAPI(`/leads?userId=${globalUser.id}&role=${globalUser.role}`) : Promise.resolve({ success: true, data: [] }),
          globalUser.role.toLowerCase() !== 'admin' ? fetchAPI(`/tasks?userId=${globalUser.id}&role=${globalUser.role}`) : Promise.resolve({ success: true, data: [] })
        ]);

        if (overviewRes.success) setStats(overviewRes.data);
        if (leadsRes.success) setRecentLeads(leadsRes.data.slice(0, 3));
        if (tasksRes.success) setMyTasks(tasksRes.data.slice(0, 3));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    loadData();
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={styles.greeting}>
              Hello, {globalUser?.name ? globalUser.name.split(' ')[0] : 'User'} 👋
            </Text>
            <Text style={styles.subtitle}>
              {globalUser?.role?.toLowerCase() === 'admin' 
                ? "Here is your admin overview today." 
                : globalUser?.role?.toLowerCase() === 'editor'
                ? "Here is your editing workspace."
                : "Here is what's happening today."}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={{ padding: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12 }}>
            <LogOut color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {globalUser?.role?.toLowerCase() !== 'editor' && (
            <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
              <View style={[styles.iconBox, { backgroundColor: '#6366f1' }]}>
                <TrendingUp color="#fff" size={20} />
              </View>
              <Text style={styles.statValue}>{loading ? '-' : stats.activeLeads}</Text>
              <Text style={styles.statLabel}>Active Leads</Text>
            </View>
          )}
          {globalUser?.role?.toLowerCase() !== 'marketing' && (
            <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
              <View style={[styles.iconBox, { backgroundColor: '#10b981' }]}>
                <CheckSquare color="#fff" size={20} />
              </View>
              <Text style={styles.statValue}>{loading ? '-' : stats.pendingTasks}</Text>
              <Text style={styles.statLabel}>Pending Tasks</Text>
            </View>
          )}
        </View>

        {/* Leads Section (Admin and Marketing Only) */}
        {globalUser?.role?.toLowerCase() !== 'editor' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Leads</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 20 }} /> : recentLeads.map(lead => (
              <TouchableOpacity key={lead._id || lead.id} style={styles.listItem}>
                <View style={styles.listIcon}>
                  <Users color="#6366f1" size={20} />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{lead.Name || lead.name}</Text>
                  <Text style={styles.listSub}>{lead.Company || lead.company}</Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={styles.listDate}>{lead._status || lead.status}</Text>
                  <ArrowRight color="#cbd5e1" size={16} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tasks Section (Marketing and Editor Only) */}
        {globalUser?.role?.toLowerCase() !== 'admin' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {globalUser?.role?.toLowerCase() === 'editor' ? 'Video Editing Tasks' : 'My Tasks'}
              </Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator size="small" color="#10b981" style={{ marginVertical: 20 }} /> : myTasks.map(task => (
            <TouchableOpacity key={task.id} style={styles.listItem}>
              <View style={[styles.listIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                {task.status === 'COMPLETED' ? (
                  <CheckSquare color="#10b981" size={20} />
                ) : task.status === 'IN_PROGRESS' ? (
                  <Play color="#10b981" size={20} />
                ) : (
                  <Circle color="#10b981" size={20} />
                )}
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{task.title}</Text>
                <Text style={styles.listSub}>{task.status}</Text>
              </View>
              <View style={styles.listRight}>
                <ArrowRight color="#cbd5e1" size={16} />
              </View>
            </TouchableOpacity>
            ))}
        </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Admin Actions</Text>
            </View>
            <TouchableOpacity style={styles.listItem}>
              <View style={[styles.listIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <ShieldAlert color="#ef4444" size={20} />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>Pending Leave Approvals</Text>
                <Text style={styles.listSub}>Review team requests</Text>
              </View>
              <ArrowRight color="#cbd5e1" size={16} />
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 35,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  listIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  listSub: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  listRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
  },
  listDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
