import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import LoginScreen from '../login';
import { useAuth } from '@/src/contexts/AuthContext';

// Mock the expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('LoginScreen', () => {
  // Setup default mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default auth context mock
    (useAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn().mockResolvedValue(undefined),
      signInWithGoogle: jest.fn(),
      signInWithApple: jest.fn(),
      isLoading: false,
    });
  });

  // Test 1: Valid login credentials
  it('should navigate to home screen on successful login', async () => {
    const mockSignIn = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Continue'));
    
    // Verify signIn was called with correct parameters
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Wait for navigation to occur
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/home');
    });
  });

  // Test 2: Invalid email format
  it('should show error message for invalid email format', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);
    
    // Enter invalid email
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'invalid-email');
    
    // Enter valid password
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Continue'));
    
    // Verify error message is displayed
    expect(queryByText('Please enter a valid email address')).toBeTruthy();
    
    // Verify signIn was not called
  });

  // Test 3: Password too short
  it('should show error message for password that is too short', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);
    
    // Enter valid email
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'test@example.com');
    
    // Enter short password
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), '12345');
    
    // Submit the form
    fireEvent.press(getByText('Continue'));
    
    // Verify error message is displayed
    expect(queryByText('Password must be at least 6 characters')).toBeTruthy();
    
    // Verify signIn was not called
  });

  // Test 4: Empty form submission
  it('should show error messages when form is submitted empty', () => {
    const { getByText, queryByText } = render(<LoginScreen />);
    
    // Submit the form without entering any data
    fireEvent.press(getByText('Continue'));
    
    // Verify error messages are displayed
    expect(queryByText('Please enter a valid email address')).toBeTruthy();
    expect(queryByText('Password must be at least 6 characters')).toBeTruthy();
    
    // Verify signIn was not called
  });

  // Test 5: Login API error
  it('should display error message when login fails', async () => {
    const errorMessage = 'Invalid credentials';
    const mockSignIn = jest.fn().mockRejectedValue(new Error(errorMessage));
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
    });

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);
    
    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Continue'));
    
    // Verify signIn was called
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Verify error message is displayed
    const errorElement = await findByText(errorMessage);
    expect(errorElement).toBeTruthy();
    
    // Verify navigation did not occur
    expect(router.replace).not.toHaveBeenCalled();
  });
});