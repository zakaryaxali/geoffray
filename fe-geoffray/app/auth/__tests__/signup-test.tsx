import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import SignupScreen from '../signup';
import { useAuth } from '@/src/contexts/AuthContext';
import { register } from '../../../src/api/authApi';

// Mock the expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
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

// Mock the authApi
jest.mock('../../../src/api/authApi', () => ({
  register: jest.fn(),
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn((title, message, buttons) => {
    if (buttons && buttons.length > 0 && buttons[0].onPress) {
      buttons[0].onPress();
    }
  }),
}));

describe('SignupScreen', () => {
  // Setup default mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default auth context mock
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: jest.fn(),
      signInWithApple: jest.fn(),
      isLoading: false,
    });
  });

  // Test 1: Valid registration
  it('should register user and navigate to login screen on successful registration', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    (register as jest.Mock).mockImplementation(mockRegister);

    const { getByPlaceholderText, getByText } = render(<SignupScreen />);
    
    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('Username (min 3 characters)'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Sign Up'));
    
    // Verify register was called with correct parameters
    expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    
    // Wait for navigation to occur
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/auth/login',
        params: { email: 'test@example.com' }
      });
    });
  });

  // Test 2: Invalid username (too short)
  it('should show error message for invalid username', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<SignupScreen />);
    
    // Enter short username
    fireEvent.changeText(getByPlaceholderText('Username (min 3 characters)'), 'ab');
    
    // Enter valid email and password
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Sign Up'));
    
    // Verify error message is displayed
    expect(queryByText('Username must be at least 3 characters')).toBeTruthy();
    
    // Verify register was not called
    expect(register).not.toHaveBeenCalled();
  });

  // Test 3: Invalid email format
  it('should show error message for invalid email format', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<SignupScreen />);
    
    // Enter valid username
    fireEvent.changeText(getByPlaceholderText('Username (min 3 characters)'), 'testuser');
    
    // Enter invalid email
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'invalid-email');
    
    // Enter valid password
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Sign Up'));
    
    // Verify error message is displayed
    expect(queryByText('Please enter a valid email address')).toBeTruthy();
    
    // Verify register was not called
    expect(register).not.toHaveBeenCalled();
  });

  // Test 4: Password too short
  it('should show error message for password that is too short', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<SignupScreen />);
    
    // Enter valid username
    fireEvent.changeText(getByPlaceholderText('Username (min 3 characters)'), 'testuser');
    
    // Enter valid email
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'test@example.com');
    
    // Enter short password
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), '12345');
    
    // Submit the form
    fireEvent.press(getByText('Sign Up'));
    
    // Verify error message is displayed
    expect(queryByText('Password must be at least 6 characters')).toBeTruthy();
    
    // Verify register was not called
    expect(register).not.toHaveBeenCalled();
  });

  // Test 5: Empty form submission
  it('should show error messages when form is submitted empty', () => {
    const { getByText, queryByText } = render(<SignupScreen />);
    
    // Submit the form without entering any data
    fireEvent.press(getByText('Sign Up'));
    
    // Verify error messages are displayed
    expect(queryByText('Username must be at least 3 characters')).toBeTruthy();
    expect(queryByText('Please enter a valid email address')).toBeTruthy();
    expect(queryByText('Password must be at least 6 characters')).toBeTruthy();
    
    // Verify register was not called
    expect(register).not.toHaveBeenCalled();
  });

  // Test 6: Registration API error
  it('should display error message when registration fails', async () => {
    const errorMessage = 'Email already exists';
    const mockRegister = jest.fn().mockRejectedValue(new Error(errorMessage));
    (register as jest.Mock).mockImplementation(mockRegister);

    const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);
    
    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('Username (min 3 characters)'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password (min 6 characters)'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Sign Up'));
    
    // Verify register was called
    expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    
    // Verify error message is displayed
    const errorElement = await findByText(errorMessage);
    expect(errorElement).toBeTruthy();
    
    // Verify navigation did not occur
    expect(router.replace).not.toHaveBeenCalled();
  });

  // Test 7: Navigation to login page
  it('should navigate to login page when "Sign in" link is clicked', () => {
    const { getByText } = render(<SignupScreen />);
    
    // Click the "Sign in" link
    fireEvent.press(getByText('Sign in'));
    
    // Verify navigation occurred
    expect(router.push).toHaveBeenCalledWith('/auth/login');
  });

  // Test 8: Google sign-in
  it('should call signInWithGoogle when Google button is pressed', async () => {
    const mockSignInWithGoogle = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
      signInWithApple: jest.fn(),
      isLoading: false,
    });

    const { getByText } = render(<SignupScreen />);
    
    // Press the Google sign-in button
    fireEvent.press(getByText('Continue with Google'));
    
    // Verify signInWithGoogle was called
    expect(mockSignInWithGoogle).toHaveBeenCalled();
    
    // Wait for navigation to occur
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/home');
    });
  });

  // Test 9: Apple sign-in
  it('should call signInWithApple when Apple button is pressed', async () => {
    const mockSignInWithApple = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: jest.fn(),
      signInWithApple: mockSignInWithApple,
      isLoading: false,
    });

    const { getByText } = render(<SignupScreen />);
    
    // Press the Apple sign-in button
    fireEvent.press(getByText('Continue with Apple'));
    
    // Verify signInWithApple was called
    expect(mockSignInWithApple).toHaveBeenCalled();
    
    // Wait for navigation to occur
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/home');
    });
  });
});
