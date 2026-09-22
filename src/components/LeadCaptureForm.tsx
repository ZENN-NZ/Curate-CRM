import React, { useState } from 'react';
import { User, Calendar, MapPin, Phone, Building, CheckCircle, AlertCircle, Loader2, Heart, Mail } from 'lucide-react';
import { LeadSchema, Lead } from '../types';
import { leadService } from '../services/leadService';

interface LeadCaptureFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: Lead;
}

export default function LeadCaptureForm({ onSuccess, onCancel, initialData }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dob: initialData?.dob || '',
    residentialAddress: initialData?.residentialAddress || '',
    postalCode: initialData?.postalCode || '',
    mobileNumber: initialData?.mobileNumber || '',
    emailAddress: initialData?.emailAddress || '',
    companyName: initialData?.companyName || '',
    partnerName: initialData?.partnerName || '',
    partnerDob: initialData?.partnerDob || '',
    partnerPhone: initialData?.partnerPhone || '',
    partnerEmail: initialData?.partnerEmail || ''
  });
  
  const [hasPartner, setHasPartner] = useState(!!initialData?.partnerName);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    
    try {
      const dataToValidate = {
        ...formData,
        id: initialData?.id,
        createdAt: initialData?.createdAt,
        partnerName: hasPartner ? formData.partnerName : null,
        partnerDob: hasPartner ? formData.partnerDob : null,
        partnerPhone: hasPartner ? formData.partnerPhone : null,
        partnerEmail: hasPartner ? formData.partnerEmail : null,
      };

      LeadSchema.parse(dataToValidate);
      setIsSubmitting(true);

      await leadService.saveLead(dataToValidate);

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormData({
          firstName: '', lastName: '', dob: '', residentialAddress: '',
          postalCode: '', mobileNumber: '', emailAddress: '', companyName: '', 
          partnerName: '', partnerDob: '', partnerPhone: '', partnerEmail: ''
        });
        setHasPartner(false);
        onSuccess();
      }, 1200);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((issue: any) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0]] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setSubmitError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-blue-100 text-center animate-in fade-in zoom-in duration-300">
        <CheckCircle className="w-16 h-16 text-blue-600 mb-4" />
        <h3 className="text-2xl font-semibold text-zinc-900 mb-2">{initialData ? 'Contact Updated' : 'Contact Saved'}</h3>
        <p className="text-zinc-500">The details have been securely stored.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden ${initialData ? 'max-h-full overflow-y-auto w-full max-w-3xl' : ''}`}>
      <div className="bg-blue-50/50 px-6 py-8 border-b border-blue-100 relative">
        <h2 className="text-2xl font-bold text-blue-950 mb-1">{initialData ? 'Edit Contact' : 'Add Contact'}</h2>
        <p className="text-blue-900/80 text-sm">
          {initialData ? 'Update details below for this contact.' : 'Please fill in the information below.'}
        </p>
        {onCancel && (
          <button 
            onClick={onCancel}
            type="button"
            className="absolute top-6 right-6 p-2 bg-white text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-full border border-zinc-200 transition-colors shadow-sm"
          >
            <AlertCircle className="w-4 h-4 opacity-0 hidden" />
            <span className="text-xs font-semibold px-2">Cancel</span>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {submitError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start text-sm">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p>{submitError}</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.firstName ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                  placeholder="Jane"
                />
              </div>
              {errors.firstName && <p className="text-xs text-red-600">{errors.firstName}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.lastName ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                  placeholder="Doe"
                />
              </div>
              {errors.lastName && <p className="text-xs text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.mobileNumber ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {errors.mobileNumber && <p className="text-xs text-red-600">{errors.mobileNumber}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.emailAddress ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                  placeholder="jane@example.com"
                />
              </div>
              {errors.emailAddress && <p className="text-xs text-red-600">{errors.emailAddress}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.dob ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                />
              </div>
              {errors.dob && <p className="text-xs text-red-600">{errors.dob}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Company Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.companyName ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                  placeholder="ACME Corp"
                />
              </div>
              {errors.companyName && <p className="text-xs text-red-600">{errors.companyName}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Residential Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                name="residentialAddress"
                value={formData.residentialAddress}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.residentialAddress ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                placeholder="123 Main St, Suite 100"
              />
            </div>
            {errors.residentialAddress && <p className="text-xs text-red-600">{errors.residentialAddress}</p>}
          </div>

          <div className="space-y-1.5 sm:w-1/2 sm:pr-2.5">
            <label className="text-sm font-medium text-zinc-700">Postal Code</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.postalCode ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-300'} rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow`}
                placeholder="90210"
              />
            </div>
            {errors.postalCode && <p className="text-xs text-red-600">{errors.postalCode}</p>}
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5">
            <div className="mb-3 sm:mb-0">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Partner Details</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Include significant other's information</p>
            </div>
            <label className="flex items-center cursor-pointer select-none">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={hasPartner} 
                  onChange={() => setHasPartner(!hasPartner)} 
                />
                <div className={`block w-12 h-7 rounded-full transition-colors ${hasPartner ? 'bg-blue-800' : 'bg-zinc-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${hasPartner ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-zinc-700">
                {hasPartner ? 'Added' : 'Add Partner'}
              </span>
            </label>
          </div>

          {hasPartner && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-zinc-700">Partner Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    name="partnerName"
                    value={formData.partnerName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Partner Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="tel"
                    name="partnerPhone"
                    value={formData.partnerPhone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Partner Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    name="partnerEmail"
                    value={formData.partnerEmail}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Partner DOB</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="date"
                    name="partnerDob"
                    value={formData.partnerDob}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-blue-800 sm:text-sm transition-shadow"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 px-4 border border-zinc-200 rounded-xl shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${onCancel ? 'flex-[2]' : 'w-full'} flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing securely...
              </span>
            ) : (
              initialData ? 'Update Contact' : 'Save Contact'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
