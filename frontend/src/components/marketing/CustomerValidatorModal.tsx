"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@kit/ui/dialog';
import Button from './Button';
import { cn } from '@kit/ui/utils';
// import { submitToCustomerValidatorWaitlist } from '@kit/waitlist/client';

// Define a more comprehensive question type structure
type BaseQuestion = {
  id: string;
  text: string;
  step: number;
  required: boolean;
};

type RadioQuestion = BaseQuestion & {
  type: 'radio';
  options: Array<{ value: string; label: string }>;
};

type CheckboxQuestion = BaseQuestion & {
  type: 'checkbox';
  options: Array<{ value: string; label: string }>;
};

type TextareaQuestion = BaseQuestion & {
  type: 'textarea';
  placeholder?: string;
};

type TextQuestion = BaseQuestion & {
  type: 'text';
  placeholder?: string;
};

type Question = RadioQuestion | CheckboxQuestion | TextareaQuestion | TextQuestion;

type Step = {
  id: number;
  title: string;
  description: string;
};

// Import questions from JSON file
import questionsDataImport from './customer-validator-questions.json';

// Define proper type for the JSON structure
type QuestionsData = {
  steps: Array<Step>;
  questions: Array<Question>;
};

// Cast the imported data to the correct type
const questionsData = questionsDataImport as unknown as QuestionsData;

type CustomerInfo = {
  name: string;
  companyName: string;
  email: string;
  phone: string;
}

type CustomerValidatorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string | null;
};

// Helper function for phone mask
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Apply formatting based on length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else {
    // Handle international numbers or longer formats
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
};

const CustomerValidatorModal = ({ isOpen, onClose, selectedPlan }: CustomerValidatorModalProps) => {
  // Get steps and questions from the JSON file
  const STEPS: Step[] = questionsData.steps;
  const QUESTIONS: Question[] = questionsData.questions;

  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    companyName: '',
    email: '',
    phone: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter questions for the current step
  const currentStepQuestions = QUESTIONS.filter(q => q.step === currentStep);

  // Set the initial question index when step changes
  useEffect(() => {
    // Reset current question index when step changes
    setCurrentQuestionIndex(0);
  }, [currentStep]);

  // Determine if we're at the registration step (last step)
  const isRegistrationStep = currentStep === STEPS.length;

  const handleQuestionAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // Handle checkbox selection (toggle value in array)
  const handleCheckboxChange = (questionId: string, value: string, checked: boolean) => {
    const currentAnswers = answers[questionId] as string[] || [];
    let newAnswers: string[];

    if (checked) {
      newAnswers = [...currentAnswers, value];
    } else {
      newAnswers = currentAnswers.filter(item => item !== value);
    }

    setAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
  };

  const handleNextQuestion = () => {
    // Check if current question is required and has an answer
    if (currentQuestion?.required) {
      const currentAnswer = answers[currentQuestion.id];
      // Check if answer exists and is not empty
      const hasValidAnswer = currentAnswer !== undefined &&
        (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer.trim() !== '');

      if (!hasValidAnswer) {
        // Show validation error
        setFormErrors(prev => ({
          ...prev,
          [currentQuestion.id]: 'This question requires an answer'
        }));
        return;
      }
    }

    // Clear any error for this question
    setFormErrors(prev => {
      const newErrors = { ...prev };
      if (currentQuestion) delete newErrors[currentQuestion.id];
      return newErrors;
    });

    if (currentQuestionIndex < currentStepQuestions.length - 1) {
      // Move to next question within the current step
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentStep < STEPS.length) {
      // Move to next step
      setCurrentStep(prev => prev + 1);
    } else {
      // Submit form when on the last step and last question
      handleSubmit();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Move to previous question within the current step
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentStep > 1) {
      // Move to previous step
      setCurrentStep(prev => prev - 1);
      // Set current question index to the last question of the previous step
      const previousStepQuestions = QUESTIONS.filter(q => q.step === currentStep - 1);
      setCurrentQuestionIndex(previousStepQuestions.length - 1);
    }
  };

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  // Add formErrors to component state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Validate the email format
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle email with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toLowerCase();
    handleCustomerInfoChange('email', value);

    if (value && !validateEmail(value)) {
      setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  // Handle name input (capitalize first letters)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Capitalize each word
    const formattedValue = value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    handleCustomerInfoChange('name', formattedValue);

    if (!formattedValue && attemptedSubmit) {
      setFormErrors(prev => ({ ...prev, name: 'Name is required' }));
    } else {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  // Handle form submission
  const validateContactForm = () => {
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!customerInfo.name) {
      errors.name = 'Name is required';
    }

    if (!customerInfo.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(customerInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    // For registration step, validate form first
    if (isRegistrationStep) {
      // Set attempted submit to true before validation
      setAttemptedSubmit(true);

      // Validate and continue only if validation passes
      if (!validateContactForm()) {
        return; // Stop if validation fails
      }
    }

    // Submit data to the waitlist with the qualification data
    // Mock submission
    console.log('Submitting to waitlist:', {
      selectedPlan,
      customerInfo,
      qualifyQuestions: answers,
    });

    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
    }, 1000);
    /*
    submitToCustomerValidatorWaitlist({
      selectedPlan,
      customerInfo,
      qualifyQuestions: answers,
    })
      .then(() => {
        // Show thank you message instead of alert
        setIsSubmitted(true);
      })
      .catch((error: Error) => {
        console.error('Error submitting to waitlist:', error);
        alert('There was an error processing your request. Please try again.');
      });
    */
  };

  // Get current question (safely)
  const currentQuestion = currentStepQuestions[currentQuestionIndex] || currentStepQuestions[0];

  // Helper to check if checkbox is selected
  const isCheckboxSelected = (questionId: string, value: string): boolean => {
    const currentAnswers = answers[questionId] as string[] || [];
    return currentAnswers.includes(value);
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="hidden md:block bg-[#4646FF] text-white dark:bg-[#3838CC] rounded-lg p-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-300 rounded-full translate-x-[-50%] translate-y-[50%] opacity-40"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500 rounded-full translate-x-[50%] translate-y-[-50%] opacity-40"></div>
        <div className="absolute bottom-20 right-10 w-6 h-6 border-2 border-white rounded-full opacity-40"></div>
        <div className="absolute bottom-24 right-16 w-4 h-4 border-2 border-white rotate-45 opacity-40"></div>

        {/* Steps */}
        <div className="relative z-10 space-y-6">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 border-white",
                currentStep === s.id ? "bg-[#DBF3FF] text-[#4646FF] dark:bg-[#2A2A8C] dark:text-white" : "bg-transparent text-white"
              )}>
                {s.id}
              </div>
              <div>
                <p className="text-xs font-semibold">STEP {s.id}</p>
                <p className="text-sm font-bold">{s.title}</p>
                <p className="text-xs opacity-80">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render mobile step indicator
  const renderMobileStepIndicator = () => {
    return (
      <div className="md:hidden">
        <div className="bg-[#4646FF] dark:bg-[#3838CC] text-white px-6 py-4 relative overflow-hidden">
          {/* Background decorations for mobile */}
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-300 rounded-full translate-x-[-50%] translate-y-[50%] opacity-40"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500 rounded-full translate-x-[50%] translate-y-[-50%] opacity-40"></div>
          <div className="absolute bottom-8 right-6 w-4 h-4 border-2 border-white rounded-full opacity-40"></div>
          <div className="absolute bottom-12 right-10 w-3 h-3 border-2 border-white rotate-45 opacity-40"></div>

          {/* Title for current step */}
          <h2 className="text-xl font-bold relative z-10">
            {currentStepData?.title || 'Your Info'}
          </h2>
          <p className="text-sm opacity-80 relative z-10">
            {currentStepData?.description || 'Please provide your information'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex flex-col items-center",
                currentStep === s.id
                  ? "text-[#4646FF] dark:text-[#6464FF]"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1",
                currentStep === s.id
                  ? "bg-[#DBF3FF] text-[#4646FF] border-[#4646FF] dark:bg-[#2A2A8C] dark:text-white dark:border-[#6464FF]"
                  : "bg-white text-gray-400 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
              )}>
                {s.id}
              </div>
              <span className="text-xs font-medium">
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the form for gathering contact info (last step)
  const renderContactForm = () => {
    // Handle phone input with mask
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const formattedValue = formatPhoneNumber(value);
      e.target.value = formattedValue;
      handleCustomerInfoChange('phone', formattedValue);
    };

    // Handle company name input
    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const formattedValue = value.replace(/[^\w\s-]/gi, '');
      handleCustomerInfoChange('companyName', formattedValue);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium dark:text-gray-300">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="name"
              value={customerInfo.name}
              onChange={handleNameChange}
              onBlur={() => {
                if (!customerInfo.name) {
                  setFormErrors(prev => ({ ...prev, name: 'Name is required' }));
                }
              }}
              placeholder="e.g. Stephen King"
              required
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-md",
                formErrors.name
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-[#4646FF] focus:border-[#4646FF] dark:border-gray-700 dark:focus:ring-[#6464FF] dark:focus:border-[#6464FF]",
                "dark:bg-gray-800 dark:text-white"
              )}
            />
          </div>
          {formErrors.name && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">{formErrors.name}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">Full name as it appears on your ID</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium dark:text-gray-300">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              value={customerInfo.email}
              onChange={handleEmailChange}
              onBlur={() => {
                if (!customerInfo.email) {
                  setFormErrors(prev => ({ ...prev, email: 'Email is required' }));
                } else if (!validateEmail(customerInfo.email)) {
                  setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                }
              }}
              placeholder="e.g. stephenking@lorem.com"
              required
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-md",
                formErrors.email
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-[#4646FF] focus:border-[#4646FF] dark:border-gray-700 dark:focus:ring-[#6464FF] dark:focus:border-[#6464FF]",
                "dark:bg-gray-800 dark:text-white"
              )}
            />
          </div>
          {formErrors.email && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">{formErrors.email}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">We'll email you with project updates</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium dark:text-gray-300">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <input
              id="phone"
              value={customerInfo.phone}
              onChange={handlePhoneChange}
              placeholder="(123) 456-7890"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4646FF] focus:border-[#4646FF] dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-[#6464FF] dark:focus:border-[#6464FF]"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">For important project communications</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium dark:text-gray-300">Company Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="companyName"
              value={customerInfo.companyName}
              onChange={handleCompanyChange}
              placeholder="Your company name"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4646FF] focus:border-[#4646FF] dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-[#6464FF] dark:focus:border-[#6464FF]"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">If applicable for your project</p>
        </div>
      </div>
    );
  };

  // Render question based on its type
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    // Get error for current question if any
    const questionError = formErrors[currentQuestion.id];

    const renderRequiredIndicator = () => {
      return currentQuestion.required ? <span className="text-red-500 ml-1">*</span> : null;
    };

    switch (currentQuestion.type) {
      case 'radio':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              {currentQuestion.text}
              {renderRequiredIndicator()}
            </h3>

            {questionError && (
              <p className="text-sm text-red-500 dark:text-red-400">{questionError}</p>
            )}

            {currentQuestion.options.map(option => (
              <div
                key={option.value}
                className={cn(
                  "relative flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer overflow-hidden group",
                  (answers[currentQuestion.id] as string) === option.value
                    ? "border-[#4646FF] bg-[#F0F7FF] dark:border-[#6464FF] dark:bg-[#1E1E4A]"
                    : questionError
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                )}
                onClick={() => handleQuestionAnswer(currentQuestion.id, option.value)}
              >
                {/* Background pattern for selected option */}
                {(answers[currentQuestion.id] as string) === option.value && (
                  <div className="absolute right-0 top-0 h-full w-16 opacity-20 bg-gradient-to-l from-[#4646FF] dark:from-[#6464FF]"></div>
                )}

                <div className={cn(
                  "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center z-10",
                  (answers[currentQuestion.id] as string) === option.value
                    ? "border-[#4646FF] dark:border-[#6464FF]"
                    : questionError
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                )}>
                  {(answers[currentQuestion.id] as string) === option.value && (
                    <div className="w-3 h-3 rounded-full bg-[#4646FF] dark:bg-[#6464FF]"></div>
                  )}
                </div>

                <label className="text-sm flex-1 font-medium dark:text-gray-200 z-10">{option.label}</label>

                {/* Hover effect for unselected options */}
                {(answers[currentQuestion.id] as string) !== option.value && (
                  <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              {currentQuestion.text}
              {renderRequiredIndicator()}
            </h3>

            {questionError && (
              <p className="text-sm text-red-500 dark:text-red-400">{questionError}</p>
            )}

            {currentQuestion.options.map(option => (
              <div
                key={option.value}
                className={cn(
                  "relative flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer overflow-hidden group",
                  isCheckboxSelected(currentQuestion.id, option.value)
                    ? "border-[#4646FF] bg-[#F0F7FF] dark:border-[#6464FF] dark:bg-[#1E1E4A]"
                    : questionError
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                )}
                onClick={() => handleCheckboxChange(
                  currentQuestion.id,
                  option.value,
                  !isCheckboxSelected(currentQuestion.id, option.value)
                )}
              >
                {/* Background pattern for selected option */}
                {isCheckboxSelected(currentQuestion.id, option.value) && (
                  <div className="absolute right-0 top-0 h-full w-16 opacity-20 bg-gradient-to-l from-[#4646FF] dark:from-[#6464FF]"></div>
                )}

                <div className={cn(
                  "w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center z-10",
                  isCheckboxSelected(currentQuestion.id, option.value)
                    ? "border-[#4646FF] bg-[#4646FF] dark:border-[#6464FF] dark:bg-[#6464FF]"
                    : questionError
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                )}>
                  {isCheckboxSelected(currentQuestion.id, option.value) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <label className="text-sm flex-1 font-medium dark:text-gray-200 z-10">{option.label}</label>
              </div>
            ))}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              {currentQuestion.text}
              {renderRequiredIndicator()}
            </h3>

            {questionError && (
              <p className="text-sm text-red-500 dark:text-red-400">{questionError}</p>
            )}

            <textarea
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => handleQuestionAnswer(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder || 'Type your answer here...'}
              rows={4}
              className={cn(
                "w-full px-4 py-3 border rounded-md",
                questionError
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-[#4646FF] focus:border-[#4646FF] dark:border-gray-700 dark:focus:ring-[#6464FF] dark:focus:border-[#6464FF]",
                "dark:bg-gray-800 dark:text-white"
              )}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Please be as detailed as possible</p>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold dark:text-gray-200">
              {currentQuestion.text}
              {renderRequiredIndicator()}
            </h3>

            {questionError && (
              <p className="text-sm text-red-500 dark:text-red-400">{questionError}</p>
            )}

            <input
              type="text"
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => handleQuestionAnswer(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder || 'Type your answer here...'}
              className={cn(
                "w-full px-4 py-3 border rounded-md",
                questionError
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-[#4646FF] focus:border-[#4646FF] dark:border-gray-700 dark:focus:ring-[#6464FF] dark:focus:border-[#6464FF]",
                "dark:bg-gray-800 dark:text-white"
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Get current step data for dynamic titles
  const currentStepData = STEPS.find(s => s.id === currentStep) || STEPS[0];

  // Render thank you message after submission
  const renderThankYouMessage = () => {
    // Get WhatsApp phone number from environment variable or use fallback
    const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5511999999999";

    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Thank you for your interest!
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          We've received your information and will review your project details shortly. We're excited to help bring your vision to life!
        </p>

        <a
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-6 py-3 bg-[#25D366] text-white font-medium rounded-md shadow-md hover:bg-[#128C7E] transition-colors duration-200 w-full justify-center sm:w-auto"
        >
          <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Talk to us on WhatsApp
        </a>

        <button
          onClick={onClose}
          className="mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden dark:bg-gray-900 dark:text-white dark:border-gray-700 max-w-[90vw]">
        {/* Add DialogTitle for accessibility - visually hidden since we use custom titles */}
        <DialogTitle className="sr-only">
          {isSubmitted ? "Thank You" : currentStepData?.title || "Project Questionnaire"}
        </DialogTitle>

        {isSubmitted ? (
          // Show thank you message if form is submitted
          renderThankYouMessage()
        ) : (
          // Show form if not submitted
          <div className="flex flex-col md:flex-row">
            {/* Step indicator - Desktop version */}
            {renderStepIndicator()}

            {/* Mobile version step indicator */}
            {renderMobileStepIndicator()}

            {/* Main content */}
            <div className="p-6 md:p-8 flex-1">
              {/* Title is shown in the mobile header now */}
              <div className="md:block hidden">
                <h2 className="text-2xl font-bold text-[#0E2954] dark:text-blue-300 mb-2">
                  {currentStepData?.title || 'Your Info'}
                </h2>

                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {currentStepData?.description || 'Please provide your information'}
                </p>
              </div>

              <div className="py-4">
                {isRegistrationStep ? (
                  // Render the contact form for the last step
                  renderContactForm()
                ) : currentQuestion ? (
                  // Render the question for the current step
                  <div className="space-y-6">
                    {renderQuestion()}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={currentQuestionIndex > 0 || currentStep > 1 ? handlePrevQuestion : onClose}
                  className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {currentQuestionIndex > 0 || currentStep > 1 ? 'Back' : 'Cancel'}
                </Button>

                <Button
                  variant="primary"
                  onClick={() => {
                    if (isRegistrationStep) {
                      setAttemptedSubmit(true);
                      if (validateContactForm()) {
                        handleSubmit();
                      }
                    } else {
                      handleNextQuestion();
                    }
                  }}
                  disabled={isRegistrationStep && attemptedSubmit && (!customerInfo.name || !customerInfo.email)}
                  className="dark:bg-[#4646FF] dark:hover:bg-[#3838CC]"
                >
                  {currentStep < STEPS.length || currentQuestionIndex < currentStepQuestions.length - 1 ? 'Next' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerValidatorModal; 