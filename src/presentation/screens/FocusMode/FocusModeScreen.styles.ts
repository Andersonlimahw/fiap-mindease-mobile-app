import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Active Mode Styles
  activeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTimerCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  activeTimerText: {
    fontSize: 72,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  activeTimerLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 8,
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 40,
  },
  activeControlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  deactivateButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  deactivateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Inactive Mode Styles
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  durationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  durationButtonActive: {
    borderWidth: 0,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  soundSection: {
    marginBottom: 24,
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  soundButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  soundButtonActive: {
    borderWidth: 0,
  },
  soundText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  activateButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  activateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
