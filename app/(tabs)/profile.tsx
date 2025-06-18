import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, Award, Zap, Target, Calendar, Star, Edit3, Camera, Save, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  earned: boolean;
}

interface Stat {
  label: string;
  value: string;
  icon: any;
  color: string;
}

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'Budget Master',
    description: 'Stayed within budget for 3 months',
    icon: Target,
    color: '#00C896',
    earned: true,
  },
  {
    id: '2',
    title: 'Savings Streak',
    description: 'Saved money for 30 consecutive days',
    icon: Zap,
    color: '#FFD700',
    earned: true,
  },
  {
    id: '3',
    title: 'Goal Getter',
    description: 'Completed your first savings goal',
    icon: Award,
    color: '#FF9500',
    earned: false,
  },
];

const stats: Stat[] = [
  { label: 'Days Active', value: '127', icon: Calendar, color: '#007AFF' },
  { label: 'Goals Reached', value: '3', icon: Target, color: '#00C896' },
  { label: 'Achievements', value: '8', icon: Award, color: '#FFD700' },
  { label: 'Streak', value: '15', icon: Zap, color: '#FF9500' },
];

export default function Profile() {
  const { state: authState, logout, updateProfile, updatePreferences, deleteAccount } = useAuth();
  const { state: appState } = useAppContext();
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile editing state
  const [profileData, setProfileData] = useState({
    name: authState.user?.name || '',
    email: authState.user?.email || '',
  });

  // Settings state
  const [settingsData, setSettingsData] = useState({
    notifications: authState.user?.preferences.notifications || false,
    biometricAuth: authState.user?.preferences.biometricAuth || false,
    darkMode: authState.user?.preferences.darkMode || false,
    currency: authState.user?.preferences.currency || 'USD',
    language: authState.user?.preferences.language || 'en',
  });

  // Sync settings data with user preferences when they change
  useEffect(() => {
    if (authState.user?.preferences) {
      setSettingsData({
        notifications: authState.user.preferences.notifications || false,
        biometricAuth: authState.user.preferences.biometricAuth || false,
        darkMode: authState.user.preferences.darkMode || false,
        currency: authState.user.preferences.currency || 'USD',
        language: authState.user.preferences.language || 'en',
      });
    }
  }, [authState.user?.preferences]);

  // Calculate user stats from app data
  const getUserStats = () => {
    const completedGoals = appState.goals.filter((goal: any) => goal.currentAmount >= goal.targetAmount).length;
    const totalTransactions = appState.transactions.length;
    const daysSinceJoin = authState.user?.joinDate 
      ? Math.floor((new Date().getTime() - new Date(authState.user.joinDate).getTime()) / (1000 * 3600 * 24))
      : 0;
    
    return {
      daysActive: daysSinceJoin.toString(),
      goalsReached: completedGoals.toString(),
      transactions: totalTransactions.toString(),
      streak: '15', // This could be calculated based on consistent usage
    };
  };

  const stats = [
    { label: 'Days Active', value: getUserStats().daysActive, icon: Calendar, color: '#007AFF' },
    { label: 'Goals Reached', value: getUserStats().goalsReached, icon: Target, color: '#00C896' },
    { label: 'Transactions', value: getUserStats().transactions, icon: Award, color: '#FFD700' },
    { label: 'Streak', value: getUserStats().streak, icon: Zap, color: '#FF9500' },
  ];

  const handleLogout = () => {
    console.log('🔴 LOGOUT STEP 1: handleLogout function called');
    console.log('🔴 Current auth state:', { 
      isAuthenticated: authState.isAuthenticated, 
      user: authState.user?.email,
      isLoading: authState.isLoading 
    });
    
    // For web testing, use confirm() instead of Alert
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) {
        console.log('🔴 LOGOUT CANCELLED by user');
        return;
      }
    }
    
    const performLogout = async () => {
      try {
        console.log('🔴 LOGOUT STEP 2: User confirmed logout');
        console.log('🔴 LOGOUT STEP 3: Calling logout function...');
        
        await logout();
        
        console.log('🔴 LOGOUT STEP 4: Logout function completed successfully');
        console.log('🔴 New auth state after logout:', { 
          isAuthenticated: authState.isAuthenticated, 
          user: authState.user,
          isLoading: authState.isLoading 
        });
      } catch (error) {
        console.error('🔴 LOGOUT STEP 4: Logout failed with error:', error);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Failed to sign out. Please try again.');
        }
      }
    };
    
    performLogout();
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
      });
      setEditProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      console.log('💾 Saving settings data:', settingsData);
      await updatePreferences(settingsData);
      console.log('💾 Settings saved successfully');
      setSettingsModal(false);
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error) {
      console.error('💾 Error saving settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete all your data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete Forever', style: 'destructive', onPress: deleteAccount },
              ]
            );
          }
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Edit Profile',
      icon: Edit3,
      color: '#007AFF',
      onPress: () => {
        setProfileData({
          name: authState.user?.name || '',
          email: authState.user?.email || '',
        });
        setEditProfileModal(true);
      },
    },
    {
      title: 'Notifications',
      icon: Bell,
      color: '#FF9500',
      onPress: () => setSettingsModal(true),
    },
    {
      title: 'Security & Privacy',
      icon: Shield,
      color: '#00C896',
      onPress: () => setSecurityModal(true),
    },
    {
      title: 'Help & Support',
      icon: HelpCircle,
      color: '#007AFF',
      onPress: () => Alert.alert('Help & Support', 'Contact us at support@financeflow.com'),
    },
    {
      title: 'Settings',
      icon: Settings,
      color: '#8E8E93',
      onPress: () => setSettingsModal(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: authState.user?.avatar || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2&fit=crop&crop=face'
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{authState.user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{authState.user?.email || 'user@example.com'}</Text>
              <View style={styles.membershipBadge}>
                <Star size={12} color="#FFD700" />
                <Text style={styles.membershipText}>
                  {authState.user?.isPremium ? 'Premium Member' : 'Free Member'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.earned && styles.unearned,
                ]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.earned
                        ? `${achievement.color}15`
                        : '#F2F2F7',
                    },
                  ]}
                >
                  <achievement.icon
                    size={24}
                    color={achievement.earned ? achievement.color : '#8E8E93'}
                  />
                </View>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.earned && styles.unearnedText,
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text
                  style={[
                    styles.achievementDescription,
                    !achievement.earned && styles.unearnedText,
                  ]}
                >
                  {achievement.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: `${item.color}15` },
                    ]}
                  >
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <ChevronRight size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoTitle}>FinanceFlow</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            console.log('🔴 LOGOUT STEP 0: Sign Out button pressed!');
            handleLogout();
          }}
        >
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Edit Profile Modal */}
        <Modal
          visible={editProfileModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditProfileModal(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Save size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.avatarSection}>
                <Image
                  source={{ 
                    uri: authState.user?.avatar || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2&fit=crop&crop=face'
                  }}
                  style={styles.editAvatar}
                />
                <TouchableOpacity style={styles.changeAvatarButton}>
                  <Camera size={20} color="#007AFF" />
                  <Text style={styles.changeAvatarText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={profileData.name}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                />

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.modalInput}
                  value={profileData.email}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Member Since</Text>
                <Text style={styles.memberSinceText}>
                  {authState.user?.joinDate ? new Date(authState.user.joinDate).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Settings Modal */}
        <Modal
          visible={settingsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSettingsModal(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={handleSaveSettings} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Save size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Switch
                    value={settingsData.notifications}
                    onValueChange={(value) => setSettingsData(prev => ({ ...prev, notifications: value }))}
                    trackColor={{ false: '#E5E5E7', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Security</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Biometric Authentication</Text>
                  <Switch
                    value={settingsData.biometricAuth}
                    onValueChange={(value) => setSettingsData(prev => ({ ...prev, biometricAuth: value }))}
                    trackColor={{ false: '#E5E5E7', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Appearance</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Switch
                    value={settingsData.darkMode}
                    onValueChange={(value) => setSettingsData(prev => ({ ...prev, darkMode: value }))}
                    trackColor={{ false: '#E5E5E7', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Currency</Text>
                <View style={styles.currencyContainer}>
                  {['USD', 'INR'].map((currency) => (
                    <TouchableOpacity
                      key={currency}
                      style={[
                        styles.currencyOption,
                        settingsData.currency === currency && styles.currencyOptionSelected
                      ]}
                      onPress={() => setSettingsData(prev => ({ ...prev, currency }))}
                    >
                      <Text style={[
                        styles.currencyText,
                        settingsData.currency === currency && styles.currencyTextSelected
                      ]}>
                        {currency === 'USD' ? '$ USD' : '₹ INR'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Security Modal */}
        <Modal
          visible={securityModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSecurityModal(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Security & Privacy</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.securitySection}>
                <TouchableOpacity style={styles.securityItem}>
                  <Shield size={20} color="#007AFF" />
                  <Text style={styles.securityText}>Change Password</Text>
                  <ChevronRight size={20} color="#8E8E93" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.securityItem}>
                  <Bell size={20} color="#FF9500" />
                  <Text style={styles.securityText}>Privacy Settings</Text>
                  <ChevronRight size={20} color="#8E8E93" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.securityItem}>
                  <Settings size={20} color="#8E8E93" />
                  <Text style={styles.securityText}>Data Export</Text>
                  <ChevronRight size={20} color="#8E8E93" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.securityItem, styles.dangerItem]}
                  onPress={handleDeleteAccount}
                >
                  <LogOut size={20} color="#FF3B30" />
                  <Text style={[styles.securityText, styles.dangerText]}>Delete Account</Text>
                  <ChevronRight size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00C896',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  membershipText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementsContainer: {
    marginBottom: 24,
  },
  achievementsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  unearned: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  unearnedText: {
    color: '#8E8E93',
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  appInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appInfoTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeAvatarText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  formSection: {
    gap: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    marginBottom: 16,
  },
  memberSinceText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  settingSection: {
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  currencyOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  currencyOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  currencyTextSelected: {
    color: '#007AFF',
  },
  securitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF3B30',
  },
});