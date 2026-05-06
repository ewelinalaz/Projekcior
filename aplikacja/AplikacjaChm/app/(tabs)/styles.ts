import { Dimensions, StyleSheet } from 'react-native';

export const { width: screenWidth } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#0A0A0A', 
    paddingTop: 50 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#0A0A0A' 
  },

  // TEKSTY
  mainTitle: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    textAlign: 'center', 
    marginBottom: 40 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center', 
    color: '#FFFFFF' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 5, 
    color: '#CCCCCC' 
  },
  menuText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 15, 
    color: '#FFFFFF' 
  },

  // FORMULARZE I PRZYCISKI
  input: { 
    backgroundColor: '#1A1A1A', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#333333', 
    color: '#FFFFFF' 
  },
  button: { 
    backgroundColor: '#8f0c0c', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  backBtn: { 
    fontSize: 16, 
    color: '#8f0c0c', 
    marginBottom: 15, 
    fontWeight: 'bold' 
  },

  // KARTY I ELEMENTY LIST
  formContainer: { 
    backgroundColor: '#1A1A1A', 
    padding: 15, 
    borderRadius: 15, 
    marginTop: 15, 
    borderWidth: 1, 
    borderColor: '#333333' 
  },
  menuCard: { 
    backgroundColor: '#1A1A1A', 
    padding: 25, 
    borderRadius: 20, 
    marginBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderLeftWidth: 8, 
    borderLeftColor: '#8f0c0c' 
  },
  planItem: { 
    backgroundColor: '#1A1A1A', 
    padding: 10, 
    borderRadius: 10, 
    marginTop: 5, 
    borderLeftWidth: 4, 
    borderLeftColor: '#8f0c0c' 
  },
  icon: { 
    fontSize: 25, 
    color: '#FFFFFF' 
  }
});