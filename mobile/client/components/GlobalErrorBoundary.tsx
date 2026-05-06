import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private getErrorMessage = (): string => {
    try {
      if (this.state.error) {
        if (typeof this.state.error === 'string') {
          return this.state.error;
        }
        if (this.state.error instanceof Error) {
          return this.state.error.message || this.state.error.toString();
        }
        return String(this.state.error);
      }
      return 'Unknown error occurred';
    } catch (e) {
      return 'Error reading error details';
    }
  };

  private getStackTrace = (): string => {
    try {
      if (this.state.errorInfo?.componentStack) {
        const stack = String(this.state.errorInfo.componentStack);
        return stack.slice(0, 500);
      }
      return 'No stack trace available';
    } catch (e) {
      return 'Error reading stack trace';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>The app encountered a critical error and could not continue.</Text>

            <View style={styles.box}>
              <Text style={styles.label}>Error:</Text>
              <Text style={styles.errorText}>{this.getErrorMessage()}</Text>
            </View>

            {this.state.errorInfo && (
              <View style={styles.box}>
                <Text style={styles.label}>Stack Trace (Top):</Text>
                <Text style={styles.stackText}>{this.getStackTrace()}...</Text>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  box: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
