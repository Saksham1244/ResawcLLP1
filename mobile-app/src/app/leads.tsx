import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Phone, Mail, MoreVertical, ArrowRight } from 'lucide-react-native';

const LEADS = [
  { id: 1, name: 'John Doe', company: 'TechCorp India', status: 'New', phone: '+91 9876543210' },
  { id: 2, name: 'Jane Smith', company: 'DesignCo', status: 'Contacted', phone: '+91 9123456789' },
  { id: 3, name: 'Mike Ross', company: 'LegalFirm', status: 'Qualified', phone: '+91 8888888888' },
  { id: 4, name: 'Sarah Williams', company: 'AdAgency', status: 'Lost', phone: '+91 7777777777' },
];

export default function LeadsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {LEADS.map(lead => (
          <View key={lead.id} style={styles.leadCard}>
            <View style={styles.leadHeader}>
              <View>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadCompany}>{lead.company}</Text>
              </View>
              <View style={[
                styles.badge,
                lead.status === 'New' ? styles.badgeNew :
                lead.status === 'Contacted' ? styles.badgeContacted :
                lead.status === 'Qualified' ? styles.badgeQualified : styles.badgeLost
              ]}>
                <Text style={[
                  styles.badgeText,
                  lead.status === 'New' ? styles.badgeTextNew :
                  lead.status === 'Contacted' ? styles.badgeTextContacted :
                  lead.status === 'Qualified' ? styles.badgeTextQualified : styles.badgeTextLost
                ]}>{lead.status}</Text>
              </View>
            </View>

            <View style={styles.leadActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Phone color="#64748b" size={16} />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Mail color="#64748b" size={16} />
                <Text style={styles.actionText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]}>
                <Text style={styles.actionTextPrimary}>Details</Text>
                <ArrowRight color="#fff" size={14} />
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 15,
    color: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  leadCompany: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeNew: { backgroundColor: 'rgba(99,102,241,0.1)' },
  badgeTextNew: { color: '#6366f1', fontSize: 12, fontWeight: '700' },
  badgeContacted: { backgroundColor: 'rgba(245,158,11,0.1)' },
  badgeTextContacted: { color: '#d97706', fontSize: 12, fontWeight: '700' },
  badgeQualified: { backgroundColor: 'rgba(16,185,129,0.1)' },
  badgeTextQualified: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  badgeLost: { backgroundColor: 'rgba(239,68,68,0.1)' },
  badgeTextLost: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  leadActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  actionPrimary: {
    backgroundColor: '#6366f1',
  },
  actionTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  }
});
