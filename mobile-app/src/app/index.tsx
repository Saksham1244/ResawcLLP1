import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckSquare, TrendingUp, Users, ArrowRight, ShieldAlert, LogOut } from 'lucide-react-native';
import { globalUser, logout } from '@/utils/api';

const RECENT_LEADS = [
  { id: 1, name: "John Doe", service: "Video Editing", date: "Today" },
  { id: 2, name: "TechCorp India", service: "Social Media", date: "Yesterday" }
];

const MY_TASKS = [
  { id: 1, title: "Edit Client X Video", status: "In Progress" },
  { id: 2, title: "Review ad copies", status: "Pending" }
];

export default function HomeScreen() {
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
          <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
            <View style={[styles.iconBox, { backgroundColor: '#6366f1' }]}>
              <TrendingUp color="#fff" size={20} />
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>New Leads</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
            <View style={[styles.iconBox, { backgroundColor: '#10b981' }]}>
              <CheckSquare color="#fff" size={20} />
            </View>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
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
            
            {RECENT_LEADS.map(lead => (
              <TouchableOpacity key={lead.id} style={styles.listItem}>
                <View style={styles.listIcon}>
                  <Users color="#6366f1" size={20} />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{lead.name}</Text>
                  <Text style={styles.listSub}>{lead.service}</Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={styles.listDate}>{lead.date}</Text>
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

            {MY_TASKS.map(task => (
            <TouchableOpacity key={task.id} style={styles.listItem}>
              <View style={[styles.listIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <CheckSquare color="#10b981" size={20} />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{task.title}</Text>
                <Text style={styles.listSub}>{task.status}</Text>
              </View>
              <ArrowRight color="#cbd5e1" size={16} />
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
