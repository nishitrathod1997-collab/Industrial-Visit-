import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import {
  Experience,
  ExperienceType,
  ExperienceStatus,
  FacultyProfile,
  EligibilityRules,
  EligibilityPreviewResult,
  VerifiedOrganization,
} from '../../types';
import { ALL_BRANCHES, ALL_YEARS, ALL_SEMESTERS, ALL_DIVISIONS } from '../../utils/eligibility';
import { extractISTDateAndTime, createISTTimestamp, validateTripDeadlines, formatISTDateTime } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Sparkles,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  FileText,
  IndianRupee,
  Layers,
  HelpCircle,
  Filter,
  Check,
  Search,
  Sliders,
  ChevronRight,
  Eye,
  ExternalLink,
  Globe,
  Map,
  Compass,
  Navigation,
  RefreshCw,
} from 'lucide-react';

interface CreateEditExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedExperience: Experience) => void;
  experienceToEdit?: Experience | null;
}

const PRESET_COMPANIES = [
  { name: 'Siemens Ltd.', industry: 'Industrial Automation & Smart Grid', website: 'https://www.siemens.com/in' },
  { name: 'Tata Motors', industry: 'Automotive & Electric Vehicle Manufacturing', website: 'https://www.tatamotors.com' },
  { name: 'L&T Heavy Engineering', industry: 'Precision Manufacturing & Infrastructure', website: 'https://www.larsentoubro.com' },
  { name: 'TCS Innovation Labs', industry: 'Applied AI & Cloud Computing', website: 'https://www.tcs.com' },
  { name: 'Bhabha Atomic Research Centre', industry: 'Nuclear Science & Applied Physics', website: 'https://www.barc.gov.in' },
  { name: 'Godrej Aerospace', industry: 'Aerospace & Defense Precision Systems', website: 'https://www.godrej.com' },
  { name: 'Infosys Living Labs', industry: 'Enterprise Software & Digital Architecture', website: 'https://www.infosys.com' },
  { name: 'Mahindra & Mahindra', industry: 'Automotive R&D & Robotic Assembly', website: 'https://www.mahindra.com' },
];

const PRESET_IMAGES = [
  {
    label: 'Industrial Robotics & Automation',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'High-Tech Server & Data Center',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Precision Manufacturing Plant',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Scientific Research & Cleanroom',
    url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Automotive Assembly Line',
    url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Modern Enterprise Tech Campus',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  },
];

export const CreateEditExperienceModal: React.FC<CreateEditExperienceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  experienceToEdit,
}) => {
  const isEditing = !!experienceToEdit;
  const { role, user } = useAuth();
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [primaryFacultyId, setPrimaryFacultyId] = useState<string>('');
  const [additionalFacultyIds, setAdditionalFacultyIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      api.getAdminFacultyList().then(setFacultyList).catch(console.error);
      api.getAcademicOptions().then((opts) => {
        if (opts) {
          setAcademicOptions(opts);
        }
      }).catch(console.error);
    }
  }, [role, isOpen]);

  // Form State
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [organizationIndustry, setOrganizationIndustry] = useState('Industrial Technology');
  const [organizationWebsite, setOrganizationWebsite] = useState('');
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [experienceType, setExperienceType] = useState<ExperienceType>('Industrial Visits');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00 AM');
  const [duration, setDuration] = useState('Full Day (8 hrs)');
  const [learningHours, setLearningHours] = useState<number | ''>(8);
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [capacity, setCapacity] = useState<number>(40);
  const [contribution, setContribution] = useState<number>(0);
  const [whatStudentsWillLearn, setWhatStudentsWillLearn] = useState('');
  const [whyWorthAttendingText, setWhyWorthAttendingText] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [requirements, setRequirements] = useState('');
  const [rules, setRules] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<ExperienceStatus>('DRAFT');
  const [registrationDeadlineDate, setRegistrationDeadlineDate] = useState('');
  const [registrationDeadlineTime, setRegistrationDeadlineTime] = useState('23:59');

  // Organization Auto-Lookup State
  const [selectedVerifiedOrg, setSelectedVerifiedOrg] = useState<VerifiedOrganization | null>(null);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgSearchResults, setOrgSearchResults] = useState<VerifiedOrganization[]>([]);
  const [isSearchingOrg, setIsSearchingOrg] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [orgPresets, setOrgPresets] = useState<VerifiedOrganization[]>([]);
  const orgSearchTimeoutRef = useRef<any>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Load verified organization presets
  useEffect(() => {
    api.getOrganizationPresets().then((data) => {
      if (data && data.length > 0) {
        setOrgPresets(data);
      }
    }).catch(console.error);
  }, []);

  // Click outside to close organization search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Eligibility Rules State
  const [allowedBranches, setAllowedBranches] = useState<string[]>([]);
  const [allowedYears, setAllowedYears] = useState<number[]>([1, 2, 3, 4]);
  const [allowedSemesters, setAllowedSemesters] = useState<number[]>([]);
  const [allowedDivisions, setAllowedDivisions] = useState<string[]>([]);
  const [minCgpa, setMinCgpa] = useState<number | ''>(6.0);
  const [maxCgpa, setMaxCgpa] = useState<number | ''>('');
  const [backlogRule, setBacklogRule] = useState<'NO_RESTRICTION' | 'NO_BACKLOGS' | 'MAX_BACKLOGS'>('NO_RESTRICTION');
  const [maxBacklogs, setMaxBacklogs] = useState<number | ''>(0);
  const [minAttendance, setMinAttendance] = useState<number | ''>(75);
  const [additionalRules, setAdditionalRules] = useState<string>('');

  // Academic Options & Preview State
  const [academicOptions, setAcademicOptions] = useState<{
    branches: string[];
    years: number[];
    semesters: number[];
    divisions: string[];
  }>({
    branches: ALL_BRANCHES,
    years: ALL_YEARS,
    semesters: ALL_SEMESTERS,
    divisions: ALL_DIVISIONS,
  });

  const [previewLoading, setPreviewLoading] = useState(false);
  const [cohortPreview, setCohortPreview] = useState<EligibilityPreviewResult | null>(null);
  const [previewSearchTerm, setPreviewSearchTerm] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule' | 'eligibility' | 'learning' | 'logistics'>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGeneratedReviewVisible, setAiGeneratedReviewVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (experienceToEdit) {
      setTitle(experienceToEdit.title || '');
      setPrimaryFacultyId(experienceToEdit.primaryFacultyId || '');
      setAdditionalFacultyIds(experienceToEdit.additionalFacultyIds || []);
      setOrganization(experienceToEdit.organization || '');
      setOrganizationIndustry(experienceToEdit.organizationIndustry || 'Industrial Technology');
      setOrganizationWebsite(experienceToEdit.organizationWebsite || '');
      setOrganizationDescription(experienceToEdit.organizationDescription || '');
      setExperienceType(
        experienceToEdit.experienceType === 'Industrial Visit'
          ? 'Industrial Visits'
          : experienceToEdit.experienceType === 'Technical Tour'
          ? 'Technical Tours'
          : (experienceToEdit.experienceType as ExperienceType) || 'Industrial Visits'
      );
      setShortDescription(experienceToEdit.shortDescription || '');
      setDetailedDescription(experienceToEdit.detailedDescription || '');
      setDate(experienceToEdit.date || '');
      setTime(experienceToEdit.time || experienceToEdit.travelInfo?.reportingTime || '08:00 AM');
      setDuration(experienceToEdit.duration || 'Full Day (8 hrs)');
      setLearningHours(experienceToEdit.learningHours !== undefined ? experienceToEdit.learningHours : 8);
      setLocation(experienceToEdit.location || '');
      setAddress(experienceToEdit.address || '');
      setCity(experienceToEdit.city || '');
      setStateName(experienceToEdit.state || '');
      setCountry(experienceToEdit.country || 'India');
      setGoogleMapsUrl(experienceToEdit.googleMapsUrl || '');
      setCapacity(experienceToEdit.capacity || 40);
      setContribution(experienceToEdit.contribution || 0);
      setWhatStudentsWillLearn(
        Array.isArray(experienceToEdit.whatYouWillLearn)
          ? experienceToEdit.whatYouWillLearn.join('\n')
          : ''
      );
      const existingWhy = experienceToEdit.whyAttend || (experienceToEdit as any).whyWorthAttending;
      setWhyWorthAttendingText(
        Array.isArray(existingWhy) && existingWhy.length > 0
          ? existingWhy.join('\n')
          : ''
      );
      setLearningObjectives(
        Array.isArray(experienceToEdit.learningObjectives)
          ? experienceToEdit.learningObjectives.join('\n')
          : ''
      );
      setRequirements(
        Array.isArray(experienceToEdit.requirements) ? experienceToEdit.requirements.join('\n') : ''
      );
      setRules(
        Array.isArray(experienceToEdit.rules) ? experienceToEdit.rules.join('\n') : ''
      );
      setImage(experienceToEdit.image || '');
      setStatus(experienceToEdit.status || 'DRAFT');
      if (experienceToEdit.registrationDeadline) {
        const { date: dDate, time: dTime } = extractISTDateAndTime(experienceToEdit.registrationDeadline);
        setRegistrationDeadlineDate(dDate);
        setRegistrationDeadlineTime(dTime || '23:59');
      } else {
        setRegistrationDeadlineDate('');
        setRegistrationDeadlineTime('23:59');
      }

      const elig = experienceToEdit.eligibility;
      if (elig) {
        setAllowedBranches(elig.allowedBranches || []);
        setAllowedYears(Array.isArray(elig.allowedYears) && elig.allowedYears.length > 0 ? elig.allowedYears : [1, 2, 3, 4]);
        setAllowedSemesters(elig.allowedSemesters || []);
        setAllowedDivisions(elig.allowedDivisions || []);
        setMinCgpa(elig.minCgpa !== undefined ? elig.minCgpa : '');
        setMaxCgpa(elig.maxCgpa !== undefined ? elig.maxCgpa : '');
        setBacklogRule(elig.backlogRule || 'NO_RESTRICTION');
        setMaxBacklogs(elig.maxBacklogs !== undefined ? elig.maxBacklogs : '');
        setMinAttendance(elig.minAttendance !== undefined ? elig.minAttendance : '');
        setAdditionalRules(elig.additionalRules || '');
      } else {
        setAllowedBranches([]);
        setAllowedYears([1, 2, 3, 4]);
        setAllowedSemesters([]);
        setAllowedDivisions([]);
        setMinCgpa(6.0);
        setMaxCgpa('');
        setBacklogRule('NO_RESTRICTION');
        setMaxBacklogs(0);
        setMinAttendance(75);
        setAdditionalRules('');
      }
    } else {
      // Defaults for a new experience
      setTitle('');
      setOrganization('');
      setOrganizationIndustry('Industrial Technology');
      setOrganizationWebsite('');
      setOrganizationDescription('');
      setExperienceType('Industrial Visits');
      setShortDescription('');
      setDetailedDescription('');
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 21);
      setDate(defaultDate.toISOString().split('T')[0]);
      setTime('08:00 AM');
      setDuration('Full Day (8 hrs)');
      setLearningHours(8);
      setLocation('Mumbai Metropolitan Region');
      setAddress('Industrial Zone, Maharashtra');
      setCity('Mumbai');
      setStateName('Maharashtra');
      setCountry('India');
      setGoogleMapsUrl('');
      setCapacity(40);
      setContribution(0);
      setWhatStudentsWillLearn('Industrial automation systems and PLC workflows\nPlant telemetry, SCADA, and safety protocols\nReal-world corporate engineering operational standards');
      setWhyWorthAttendingText('Direct interaction with practicing senior engineering leads\nPractical industrial insights complementing academic curriculum\nOfficial Institutional Industrial Visit Certification upon completion');
      setLearningObjectives('Analyze real-world industrial systems and automated assembly lines\nObserve industrial quality assurance and regulatory standards\nInteract with senior practicing engineers and domain specialists');
      setRequirements('Carry valid physical College ID card at all times\nStrict business formal attire / prescribed institutional uniform\nClosed toe footwear / safety shoes mandatory for plant floor access');
      setRules('Strictly adhere to coordinator and safety engineer directives\nNo mobile photography in restricted production zones\nStay within the designated visiting cohort group');
      setImage(PRESET_IMAGES[0].url);
      setStatus('DRAFT');
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 14);
      setRegistrationDeadlineDate(deadlineDate.toISOString().split('T')[0]);
      setRegistrationDeadlineTime('23:59');
      
      // Default eligibility: Open to all branches & years, min 6.0 CGPA, 75% attendance
      setAllowedBranches([]);
      setAllowedYears([1, 2, 3, 4]);
      setAllowedSemesters([]);
      setAllowedDivisions([]);
      setMinCgpa(6.0);
      setMaxCgpa('');
      setBacklogRule('NO_RESTRICTION');
      setMaxBacklogs(0);
      setMinAttendance(75);
      setAdditionalRules('');
    }

    if (role === 'FACULTY' && !isEditing) {
      setPrimaryFacultyId(user?.id || '');
    }
    setErrorMsg(null);
    setValidationErrors({});
    setAiGeneratedReviewVisible(false);
    setActiveTab('basic');
    setCohortPreview(null);
  }, [experienceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSelectVerifiedOrg = (org: VerifiedOrganization) => {
    setSelectedVerifiedOrg(org);
    setOrganization(org.name);
    setOrganizationIndustry(org.industry);
    setOrganizationWebsite(org.officialWebsite);
    if (org.about) {
      setOrganizationDescription(org.about);
    }
    setLocation(org.location);
    setAddress(org.address);
    setCity(org.city);
    setStateName(org.state);
    setCountry(org.country || 'India');
    setLatitude(org.latitude);
    setLongitude(org.longitude);
    setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${org.name}, ${org.address}`)}`);
    setIsManuallyEdited(false);
    setShowOrgDropdown(false);
    setOrgSearchQuery(org.name);
  };

  const handleOrgSearchChange = (query: string) => {
    setOrgSearchQuery(query);
    setOrganization(query);
    setIsManuallyEdited(true);

    if (orgSearchTimeoutRef.current) {
      clearTimeout(orgSearchTimeoutRef.current);
    }

    if (!query || query.trim().length < 2) {
      setOrgSearchResults([]);
      setShowOrgDropdown(false);
      return;
    }

    setIsSearchingOrg(true);
    setShowOrgDropdown(true);

    orgSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.lookupOrganizations(query);
        setOrgSearchResults(res.matches || []);
      } catch (e) {
        console.error('Failed to lookup organizations:', e);
        setOrgSearchResults([]);
      } finally {
        setIsSearchingOrg(false);
      }
    }, 200);
  };

  const handleClearVerifiedOrg = () => {
    setSelectedVerifiedOrg(null);
    setIsManuallyEdited(true);
  };

  const handleSelectCompany = (comp: typeof PRESET_COMPANIES[0]) => {
    setOrganization(comp.name);
    setOrganizationIndustry(comp.industry);
    setOrganizationWebsite(comp.website);
    setIsManuallyEdited(true);
  };

  const handlePreviewEligibility = async () => {
    setPreviewLoading(true);
    try {
      const eligibilityPayload: EligibilityRules = {
        allowedBranches,
        allowedYears: allowedYears.length > 0 ? allowedYears : [1, 2, 3, 4],
        allowedSemesters,
        allowedDivisions,
        minCgpa: minCgpa !== '' ? Number(minCgpa) : undefined,
        maxCgpa: maxCgpa !== '' ? Number(maxCgpa) : undefined,
        backlogRule,
        maxBacklogs: backlogRule === 'MAX_BACKLOGS' && maxBacklogs !== '' ? Number(maxBacklogs) : undefined,
        minAttendance: minAttendance !== '' ? Number(minAttendance) : undefined,
        additionalRules: additionalRules.trim() || undefined,
      };
      const result = await api.previewEligibility(eligibilityPayload);
      setCohortPreview(result);
    } catch (err: any) {
      console.error('Error previewing eligibility:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleBranch = (branch: string) => {
    setAllowedBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  const toggleYear = (y: number) => {
    setAllowedYears((prev) =>
      prev.includes(y) ? (prev.length > 1 ? prev.filter((val) => val !== y) : prev) : [...prev, y].sort()
    );
  };

  const toggleSemester = (s: number) => {
    setAllowedSemesters((prev) =>
      prev.includes(s) ? prev.filter((val) => val !== s) : [...prev, s].sort((a, b) => a - b)
    );
  };

  const toggleDivision = (d: string) => {
    setAllowedDivisions((prev) =>
      prev.includes(d) ? prev.filter((val) => val !== d) : [...prev, d].sort()
    );
  };

  const handleGenerateWithAI = async () => {
    if (!title.trim() && !organization.trim()) {
      setErrorMsg('Please enter at least a Visit Title or Host Organization to generate details.');
      return;
    }
    setGeneratingAI(true);
    setErrorMsg(null);

    try {
      await new Promise((r) => setTimeout(r, 600));
      const orgName = organization.trim() || 'Premier Engineering Partner';
      const indName = organizationIndustry.trim() || 'Industrial Technology';

      setShortDescription(
        `Immersive, accredited on-site industrial visit to ${orgName} focusing on ${indName}, state-of-the-art engineering systems, and real-time plant operations.`
      );
      setDetailedDescription(
        `This intensive industrial visit offers undergraduate and postgraduate engineering students exclusive guided exposure to the production lines, testing laboratories, and engineering control centers of ${orgName}. Participants will observe large-scale technological systems in operation, engage directly with lead practicing engineers, and study industrial safety and quality protocols compliant with international benchmarks.`
      );
      setWhatStudentsWillLearn(
        `Comprehensive walkthrough of automated assembly processes and PLC control loops at ${orgName}\nInspection of precision manufacturing machinery and industrial quality checkpoints\nPractical understanding of enterprise telemetry, industrial networking, and SCADA infrastructure\nOverview of industrial sustainability, regulatory compliance, and safety standards`
      );
      setLearningObjectives(
        `Analyze real-world industrial systems and automated assembly lines\nObserve industrial quality assurance and regulatory standards\nInteract with senior practicing engineers and domain specialists`
      );
      setWhyWorthAttendingText(
        `Direct interaction with practicing senior engineering leads at ${orgName}\nPractical industrial insights directly complementing the academic curriculum\nOfficial Institutional Industrial Visit Certification upon successful completion`
      );
      setRequirements(
        `Valid Physical College ID Card mandatory at plant security check\nStrict business formal attire / prescribed institutional uniform\nClosed toe footwear / safety shoes mandatory for plant floor access`
      );
      setRules(
        `Strict adherence to faculty coordinator and safety engineer directives\nPhotography strictly prohibited inside restricted manufacturing zones\nRemain within the assigned cohort and safety walkways at all times`
      );
      setAiGeneratedReviewVisible(true);
    } catch (err: any) {
      console.error('Error generating AI data:', err);
      setErrorMsg('Failed to generate AI data. Please fill in details manually.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Title is required';
    if (!organization.trim()) errors.organization = 'Organization is required';
    if (!shortDescription.trim()) errors.shortDescription = 'Short description is required';
    if (!date.trim()) errors.date = 'Date is required';
    if (!location.trim()) errors.location = 'Location is required';
    if (!capacity || capacity < 1) errors.capacity = 'Capacity must be at least 1';

    if (!registrationDeadlineDate.trim()) {
      errors.registrationDeadline = 'Registration deadline date is required';
    } else if (date.trim()) {
      const deadlineISO = createISTTimestamp(registrationDeadlineDate, registrationDeadlineTime || '23:59');
      const deadlineCheck = validateTripDeadlines(date, time, deadlineISO);
      if (!deadlineCheck.valid) {
        errors.registrationDeadline = deadlineCheck.error || 'Registration deadline must be strictly before the trip date.';
      }
    }

    if (minCgpa !== '' && (Number(minCgpa) < 0 || Number(minCgpa) > 10)) {
      errors.minCgpa = 'Min CGPA must be between 0.0 and 10.0';
    }
    if (maxCgpa !== '' && (Number(maxCgpa) < 0 || Number(maxCgpa) > 10)) {
      errors.maxCgpa = 'Max CGPA must be between 0.0 and 10.0';
    }
    if (minCgpa !== '' && maxCgpa !== '' && Number(minCgpa) > Number(maxCgpa)) {
      errors.minCgpa = 'Min CGPA cannot exceed Max CGPA';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, overrideStatus?: ExperienceStatus) => {
    e.preventDefault();
    if (!validateForm()) {
      setErrorMsg('Please resolve all validation errors before proceeding.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const parseLines = (text: string) =>
      text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const learnArray = parseLines(whatStudentsWillLearn);
    const whyArray = parseLines(whyWorthAttendingText);
    const objArray = parseLines(learningObjectives);
    const reqArray = parseLines(requirements);
    const rulesArray = parseLines(rules);

    const highlights = [
      {
        icon: 'Clock',
        title: duration || 'Full Day',
        description: `${learningHours || 8} Active Learning Hours`,
      },
      {
        icon: 'MapPin',
        title: city || 'On-Site Plant',
        description: location || 'Industrial Facility',
      },
      {
        icon: 'GraduationCap',
        title: 'Academic Credit',
        description: 'Approved Institutional Certification',
      },
      {
        icon: 'ShieldCheck',
        title: 'Safety Compliant',
        description: 'Faculty Supervised & Insured',
      },
    ];

    const deadlineISO = createISTTimestamp(
      registrationDeadlineDate,
      registrationDeadlineTime || '23:59'
    );

    const finalStatus = overrideStatus || status;

    const experiencePayload: Partial<Experience> = {
      title: title.trim(),
      primaryFacultyId: primaryFacultyId || user?.id,
      additionalFacultyIds: additionalFacultyIds,
      organization: organization.trim(),
      organizationIndustry: organizationIndustry.trim(),
      organizationWebsite: organizationWebsite.trim(),
      organizationDescription: organizationDescription.trim(),
      experienceType,
      shortDescription: shortDescription.trim(),
      detailedDescription: detailedDescription.trim() || shortDescription.trim(),
      date,
      time,
      duration,
      learningHours: typeof learningHours === 'number' ? learningHours : 8,
      location: location.trim(),
      address: address.trim() || location.trim(),
      city: city.trim() || location.trim(),
      state: stateName.trim() || 'Maharashtra',
      country: country.trim() || 'India',
      latitude: latitude,
      longitude: longitude,
      googleMapsUrl:
        googleMapsUrl.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${organization || title}, ${address || location}, ${city}, ${stateName}, ${country}`
        )}`,
      capacity: Number(capacity) || 40,
      waitlistCapacity: Math.max(10, Math.floor(Number(capacity) * 0.5)),
      waitlistEnabled: true,
      contribution: Number(contribution) || 0,
      image: image.trim() || PRESET_IMAGES[0].url,
      status: finalStatus,
      registrationOpen: new Date().toISOString(),
      registrationDeadline: deadlineISO,
      whatYouWillLearn: learnArray.length > 0 ? learnArray : ['Comprehensive industrial engineering insights'],
      learningObjectives: objArray.length > 0 ? objArray : ['Understand modern production workflows'],
      requirements: reqArray.length > 0 ? reqArray : ['Carry physical College ID card', 'Formal dress code'],
      rules: rulesArray.length > 0 ? rulesArray : ['Follow coordinator safety guidelines at all times'],
      experienceHighlights: highlights,
      whyAttend: whyArray.length > 0 ? whyArray : [
        `Direct interaction with senior engineering leadership at ${organization}`,
        `Practical industrial insights complementing academic curriculum`,
        `Official Institutional Industrial Visit Certification upon completion`,
      ],
      whyWorthAttending: whyArray.length > 0 ? whyArray : [
        `Direct interaction with senior engineering leadership at ${organization}`,
        `Practical industrial insights complementing academic curriculum`,
        `Official Institutional Industrial Visit Certification upon completion`,
      ],
      travelInfo: {
        reportingTime: time,
        reportingLocation: 'VIT Main Campus Bus Bay',
        departureTime: '08:30 AM',
        transport: 'University AC Coach',
        expectedArrival: '10:00 AM',
        returnDeparture: '04:00 PM',
        campusArrival: '05:30 PM',
      },
      itinerary: [
        { id: 'it_1', order: 1, time: time, activity: 'Cohort Assembly & Attendance Check', description: 'VIT Main Campus Bus Bay' },
        { id: 'it_2', order: 2, time: '08:30 AM', activity: 'Campus Departure', description: 'Boarding official university coaches' },
        { id: 'it_3', order: 3, time: '10:00 AM', activity: 'Arrival & Security Induction', description: `${organization} Main Gate` },
        { id: 'it_4', order: 4, time: '10:30 AM', activity: 'Executive Welcome & Technical Keynote', description: 'Auditorium Session' },
        { id: 'it_5', order: 5, time: '11:45 AM', activity: 'Guided Plant & Floor Tour', description: 'Inspection of live engineering operations' },
        { id: 'it_6', order: 6, time: '02:00 PM', activity: 'Interactive Q&A and Engineering Panel', description: 'Discussion with practicing engineers' },
        { id: 'it_7', order: 7, time: '04:00 PM', activity: 'Return Transit to Campus', description: 'Arrival and dismissal at college' },
      ],
      eligibility: {
        allowedBranches: allowedBranches,
        allowedYears: allowedYears.length > 0 ? [...allowedYears].sort((a, b) => a - b) : [1, 2, 3, 4],
        allowedSemesters: allowedSemesters.length > 0 ? [...allowedSemesters].sort((a, b) => a - b) : [],
        allowedDivisions: allowedDivisions,
        minCgpa: minCgpa !== '' ? Number(minCgpa) : undefined,
        maxCgpa: maxCgpa !== '' ? Number(maxCgpa) : undefined,
        backlogRule,
        maxBacklogs: backlogRule === 'MAX_BACKLOGS' && maxBacklogs !== '' ? Number(maxBacklogs) : undefined,
        minAttendance: minAttendance !== '' ? Number(minAttendance) : undefined,
        additionalRules: additionalRules.trim() || undefined,
      },
    };

    try {
      let saved: Experience;
      if (isEditing && experienceToEdit) {
        saved = await api.updateExperience(experienceToEdit.id, experiencePayload);
      } else {
        saved = await api.createExperience(experiencePayload);
      }
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error('Error saving experience:', err);
      setErrorMsg(err.message || 'Failed to save experience. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter cohort preview students by search term
  const filteredPreviewStudents = cohortPreview?.eligibleStudents.filter((s) => {
    if (!previewSearchTerm.trim()) return true;
    const term = previewSearchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.studentId.toLowerCase().includes(term) ||
      s.branch.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0B2545] text-white p-5 sm:p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                {isEditing ? 'Update Visit' : 'New Industrial Exposure'}
              </span>
              <span className="text-xs text-blue-200">Coordinator Console</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
              {isEditing ? `Edit Experience: ${experienceToEdit.title}` : 'Create Industrial Experience'}
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Specify visit schedule, rule-based student eligibility, and curriculum outcomes.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 flex items-center gap-1 overflow-x-auto no-scrollbar flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'basic'
                ? 'border-[#0B2545] text-[#0B2545]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>1. Basic Info & Company</span>
            {(validationErrors.title || validationErrors.organization || validationErrors.shortDescription) && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-[#0B2545] text-[#0B2545]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>2. Date, Time & Location</span>
            {(validationErrors.date || validationErrors.location) && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('eligibility')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'eligibility'
                ? 'border-[#0B2545] text-[#0B2545]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>3. Eligibility Criteria</span>
            {allowedBranches.length > 0 && (
              <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 font-bold">
                {allowedBranches.length} Depts
              </span>
            )}
            {(validationErrors.minCgpa || validationErrors.maxCgpa) && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('learning')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'learning'
                ? 'border-[#0B2545] text-[#0B2545]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>4. What Students Learn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logistics')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'logistics'
                ? 'border-[#0B2545] text-[#0B2545]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>5. Image, Capacity & Status</span>
            {validationErrors.capacity && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            )}
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2 px-6">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              {/* Organization Search & Auto-Lookup Bar */}
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/40 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#0B2545] text-white flex items-center justify-center shadow-xs">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Host Enterprise & Location Auto-Lookup</h4>
                      <p className="text-[11px] text-slate-500">
                        Type company or institute name to auto-populate official website, real address, and Google Maps coordinates.
                      </p>
                    </div>
                  </div>
                  {selectedVerifiedOrg && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Verified Organization
                    </span>
                  )}
                </div>

                {/* Search Input with Autocomplete Dropdown */}
                <div className="relative" ref={orgDropdownRef}>
                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orgSearchQuery || organization}
                      onChange={(e) => handleOrgSearchChange(e.target.value)}
                      onFocus={() => {
                        if (orgSearchQuery.trim().length >= 2 || orgSearchResults.length > 0) {
                          setShowOrgDropdown(true);
                        }
                      }}
                      placeholder="Search company (e.g., IIT Bombay, Siemens, Tata Motors, L&T, BARC, ISRO, Infosys)..."
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none shadow-xs"
                    />
                    {isSearchingOrg ? (
                      <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    ) : orgSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOrgSearchQuery('');
                          setOrgSearchResults([]);
                          setShowOrgDropdown(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {/* Dropdown Suggestions */}
                  {showOrgDropdown && orgSearchResults.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {orgSearchResults.map((org) => (
                        <button
                          key={org.id || org.name}
                          type="button"
                          onClick={() => handleSelectVerifiedOrg(org)}
                          className="w-full p-3 text-left hover:bg-blue-50/60 transition-colors flex items-start justify-between gap-3 cursor-pointer group"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                                {org.name}
                              </span>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                {org.city}, {org.state}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{org.industry}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{org.address}</p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded group-hover:bg-blue-600 group-hover:text-white flex-shrink-0 mt-0.5">
                            Autofill
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Presets Pills */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-[#0B2545] flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Popular Industrial & Research Presets
                    </span>
                    <span>Click to autofill company & coordinates</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(orgPresets.length > 0 ? orgPresets.slice(0, 10) : PRESET_COMPANIES).map((comp: any) => {
                      const isSelected = organization === comp.name;
                      return (
                        <button
                          key={comp.name}
                          type="button"
                          onClick={() => {
                            if (comp.officialWebsite && comp.city) {
                              handleSelectVerifiedOrg(comp as VerifiedOrganization);
                            } else {
                              handleSelectCompany(comp);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                          }`}
                        >
                          <span>{comp.name}</span>
                          {comp.isVerified && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Verified Organization Profile Card */}
                {organization && (
                  <div className="rounded-lg bg-white border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{organization}</span>
                        {selectedVerifiedOrg && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Verified Location & Website
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {organizationIndustry} • {location || 'Location specified in Tab 2'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {organizationWebsite && (
                        <a
                          href={organizationWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                        >
                          <Globe className="h-3 w-3" />
                          <span>Official Website</span>
                          <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                        </a>
                      )}
                      {selectedVerifiedOrg && (
                        <button
                          type="button"
                          onClick={handleClearVerifiedOrg}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Edit Manually
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Industrial Visit Title <span className="text-rose-500">*</span></span>
                    {validationErrors.title && (
                      <span className="text-[11px] text-rose-600 font-medium">{validationErrors.title}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Advanced Robotic Automation & SCADA Systems Exposure"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Experience Type</label>
                  <select
                    value={experienceType}
                    onChange={(e) => setExperienceType(e.target.value as ExperienceType)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  >
                    <option value="Industrial Visits">Industrial Visits</option>
                    <option value="Technical Tours">Technical Tours</option>
                    <option value="Corporate Immersion">Corporate Immersion</option>
                    <option value="Research Facility Tours">Research Facility Tours</option>
                    <option value="Site Inspection">Site Inspection</option>
                  </select>
                </div>
              </div>

              {/* Organization, Industry & Official Website */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Host Enterprise / Plant <span className="text-rose-500">*</span></span>
                    {validationErrors.organization && (
                      <span className="text-[11px] text-rose-600 font-medium">{validationErrors.organization}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => {
                      setOrganization(e.target.value);
                      setIsManuallyEdited(true);
                    }}
                    placeholder="e.g., Siemens India Center of Excellence"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Industrial Sector</label>
                  <input
                    type="text"
                    value={organizationIndustry}
                    onChange={(e) => {
                      setOrganizationIndustry(e.target.value);
                      setIsManuallyEdited(true);
                    }}
                    placeholder="e.g., Advanced Manufacturing & Robotics"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Official Website URL</label>
                    {organizationWebsite && (
                      <a
                        href={organizationWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Globe className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={organizationWebsite}
                      onChange={(e) => {
                        setOrganizationWebsite(e.target.value);
                        setIsManuallyEdited(true);
                      }}
                      placeholder="https://www.siemens.com/in"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Faculty Coordinator Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Lead Faculty Coordinator {role === 'ADMIN' ? '(Assigned by HOD)' : ''}
                </label>
                <select
                  value={primaryFacultyId}
                  onChange={(e) => setPrimaryFacultyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0B2545] focus:outline-none"
                >
                  <option value="">Select Lead Faculty Coordinator...</option>
                  {facultyList.map((f) => (
                    <option key={f.id || f.facultyId} value={f.id || f.facultyId || f.userId}>
                      {f.name} ({f.department} - {f.designation || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Auto-Complete Assistant */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">AI Curriculum Assistant</h4>
                      <p className="text-[11px] text-indigo-700">
                        Auto-generate detailed summaries, what students will learn, and safety requirements.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={generatingAI}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {generatingAI ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Drafting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generate Descriptions</span>
                      </>
                    )}
                  </button>
                </div>

                {aiGeneratedReviewVisible && (
                  <div className="rounded-lg bg-white border border-indigo-200 p-3 text-[11px] text-indigo-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Content drafted successfully. You can review or edit in the tabs below.
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiGeneratedReviewVisible(false)}
                      className="text-indigo-600 hover:underline font-semibold text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              {/* Short & Detailed Description */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Short Summary (Visible on Experience Card) <span className="text-rose-500">*</span></span>
                    {validationErrors.shortDescription && (
                      <span className="text-[11px] text-rose-600 font-medium">{validationErrors.shortDescription}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence overview of the industrial visit"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Detailed Comprehensive Description</label>
                  <textarea
                    rows={4}
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    placeholder="In-depth explanation of the plant operations, technology stack, and day schedule..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE, TIME & LOCATION */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Trip Date <span className="text-rose-500">*</span></span>
                    {validationErrors.date && (
                      <span className="text-[11px] text-rose-600 font-medium">{validationErrors.date}</span>
                    )}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                {/* Reporting Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Reporting Time (Assembly)</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>

              {/* Registration Deadline Box */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#0B2545]" />
                    <label className="text-xs font-bold text-slate-900">
                      Registration & Cancellation Deadline <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <span className="rounded bg-blue-100 text-[#0B2545] px-2 py-0.5 text-[10px] font-bold">
                    Asia/Kolkata (IST)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  After this exact date and time, new registrations close, cancellations are locked, and the waitlist freezes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 block">Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={registrationDeadlineDate}
                      onChange={(e) => setRegistrationDeadlineDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 block">Deadline Time (IST)</label>
                    <input
                      type="time"
                      value={registrationDeadlineTime}
                      onChange={(e) => setRegistrationDeadlineTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                    />
                  </div>
                </div>

                {validationErrors.registrationDeadline && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{validationErrors.registrationDeadline}</span>
                  </div>
                )}
              </div>

              {/* Venue & Physical Address */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Facility / Plant Location <span className="text-rose-500">*</span></span>
                    {validationErrors.location && (
                      <span className="text-[11px] text-rose-600 font-medium">{validationErrors.location}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setIsManuallyEdited(true);
                    }}
                    placeholder="e.g., Rabale MIDC Industrial Area, Navi Mumbai"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Full Physical Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setIsManuallyEdited(true);
                    }}
                    placeholder="Plot No. 42, TTC Industrial Area, Thane-Belapur Road"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                {/* City, State, Country Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setIsManuallyEdited(true);
                      }}
                      placeholder="Mumbai"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0B2545] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">State</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => {
                        setStateName(e.target.value);
                        setIsManuallyEdited(true);
                      }}
                      placeholder="Maharashtra"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0B2545] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setIsManuallyEdited(true);
                      }}
                      placeholder="India"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0B2545] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Google Maps Integration Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-[#0B2545] text-white flex items-center justify-center">
                      <Map className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Google Maps Geolocation & Pin</h4>
                      <p className="text-[11px] text-slate-500">
                        {latitude && longitude
                          ? `GPS Coordinates: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`
                          : 'Location pinned from address and host organization'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={
                      googleMapsUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${organization || title}, ${address || location}, ${city || 'Mumbai'}`
                      )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                </div>

                {/* Google Maps Iframe Embed Preview */}
                <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-300 bg-slate-200 relative">
                  <iframe
                    title="Location Google Map Preview"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${
                      latitude && longitude
                        ? `${latitude},${longitude}`
                        : encodeURIComponent(`${organization || title} ${address || location} ${city || 'Mumbai'}`)
                    }&hl=en&z=14&output=embed`}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ELIGIBILITY CRITERIA */}
          {activeTab === 'eligibility' && (
            <div className="space-y-6">
              {/* Info banner */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-950">Per-Visit Rule-Based Academic Eligibility</h4>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Configure precise academic rules for this specific visit. Eligibility is evaluated strictly on the backend during registration using verified student records.
                    </p>
                  </div>
                </div>
              </div>

              {/* Criteria 1: Department / Branch Selection */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-[#0B2545]" />
                    <span>Eligible Departments & Branches</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({allowedBranches.length === 0 ? 'All Departments Allowed' : `${allowedBranches.length} Selected`})
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllowedBranches(academicOptions.branches)}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAllowedBranches([])}
                      className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                    >
                      Open to All ({academicOptions.branches.length})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {academicOptions.branches.map((branch) => {
                    const isSelected = allowedBranches.includes(branch);
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => toggleBranch(branch)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0B2545] bg-[#0B2545] text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="line-clamp-1">{branch}</span>
                        {isSelected ? (
                          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-slate-300 flex-shrink-0"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Criteria 2: Academic Year & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Year Selection */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[#0B2545]" />
                      <span>Academic Years</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAllowedYears([1, 2, 3, 4])}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      All 4 Years
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { year: 1, label: '1st Year (FE)' },
                      { year: 2, label: '2nd Year (SE)' },
                      { year: 3, label: '3rd Year (TE)' },
                      { year: 4, label: '4th Year (BE)' },
                    ].map(({ year, label }) => {
                      const isSelected = allowedYears.includes(year);
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => toggleYear(year)}
                          className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Semester Selection */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[#0B2545]" />
                      <span>Semesters</span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({allowedSemesters.length === 0 ? 'All Semesters' : `${allowedSemesters.length} Selected`})
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAllowedSemesters([])}
                      className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                    >
                      Open All
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                      const isSelected = allowedSemesters.includes(sem);
                      return (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => toggleSemester(sem)}
                          className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Sem {sem}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Criteria 3: Division Selection */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#0B2545]" />
                    <span>Class Divisions</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({allowedDivisions.length === 0 ? 'All Divisions Allowed' : `${allowedDivisions.join(', ')}`})
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAllowedDivisions([])}
                    className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                  >
                    Open to All Divisions
                  </button>
                </div>

                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map((div) => {
                    const isSelected = allowedDivisions.includes(div);
                    return (
                      <button
                        key={div}
                        type="button"
                        onClick={() => toggleDivision(div)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'border-[#0B2545] bg-[#0B2545] text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Division {div}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Criteria 4: CGPA, Backlogs & Attendance Thresholds */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CGPA Requirements */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <label className="text-xs font-bold text-slate-900 block">
                    Academic CGPA Requirements
                  </label>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Minimum CGPA (0.0 - 10.0)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={minCgpa}
                        onChange={(e) => setMinCgpa(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 6.0"
                        className="w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Maximum CGPA (Optional Ceiling)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={maxCgpa}
                        onChange={(e) => setMaxCgpa(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Leave blank for no upper limit"
                        className="w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Backlog Policy */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <label className="text-xs font-bold text-slate-900 block">
                    Active Backlog Policy
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                      <input
                        type="radio"
                        name="backlogRule"
                        checked={backlogRule === 'NO_RESTRICTION'}
                        onChange={() => setBacklogRule('NO_RESTRICTION')}
                        className="text-[#0B2545] focus:ring-[#0B2545]"
                      />
                      <span>No Restriction (Any status)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                      <input
                        type="radio"
                        name="backlogRule"
                        checked={backlogRule === 'NO_BACKLOGS'}
                        onChange={() => setBacklogRule('NO_BACKLOGS')}
                        className="text-[#0B2545] focus:ring-[#0B2545]"
                      />
                      <span className="text-emerald-700 font-bold">Strict: 0 Active Backlogs</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                      <input
                        type="radio"
                        name="backlogRule"
                        checked={backlogRule === 'MAX_BACKLOGS'}
                        onChange={() => setBacklogRule('MAX_BACKLOGS')}
                        className="text-[#0B2545] focus:ring-[#0B2545]"
                      />
                      <span>Max Allowed Backlogs:</span>
                    </label>

                    {backlogRule === 'MAX_BACKLOGS' && (
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={maxBacklogs}
                        onChange={(e) => setMaxBacklogs(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Max backlogs allowed"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Minimum Attendance */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <label className="text-xs font-bold text-slate-900 block">
                    Minimum Attendance Threshold
                  </label>
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Required Attendance Rate (%)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={minAttendance}
                      onChange={(e) => setMinAttendance(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 75"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Standard university policy mandates at least 75% attendance to qualify for off-campus industrial excursions.
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Rules & Guidelines */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">Special Academic Eligibility Notes</label>
                <input
                  type="text"
                  value={additionalRules}
                  onChange={(e) => setAdditionalRules(e.target.value)}
                  placeholder="e.g., Preference given to students enrolled in Embedded Systems and IoT Elective"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              {/* LIVE COHORT ELIGIBILITY PREVIEW */}
              <div className="rounded-xl border border-indigo-200 bg-slate-50 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span>Live Student Cohort Eligibility Preview</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Simulate the configured rules against the active institutional student directory to verify eligible student capacity.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePreviewEligibility}
                    disabled={previewLoading}
                    className="rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
                  >
                    {previewLoading ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Evaluating Cohort...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview Eligible Students</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Results Display */}
                {cohortPreview && (
                  <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-4 shadow-xs">
                    {/* Key Metrics Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/60 rounded-lg p-3 border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          {cohortPreview.percentage}%
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {cohortPreview.totalEligible} of {cohortPreview.totalStudents} Students Eligible
                          </span>
                          <span className="text-[11px] text-indigo-700">
                            Visit Capacity: {capacity} seats ({cohortPreview.totalEligible >= capacity ? 'Sufficient candidate pool' : 'Under capacity'})
                          </span>
                        </div>
                      </div>

                      {/* Search in preview */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={previewSearchTerm}
                          onChange={(e) => setPreviewSearchTerm(e.target.value)}
                          placeholder="Filter preview list..."
                          className="w-48 pl-8 pr-3 py-1 rounded-md border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Breakdown by Branch */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Breakdown by Department
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(cohortPreview.breakdownByBranch).map(([br, count]) => (
                          <span
                            key={br}
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800"
                          >
                            <span>{br}:</span>
                            <span className="font-bold text-[#0B2545]">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown by Year */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Breakdown by Academic Year
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(cohortPreview.breakdownByYear).map(([yr, count]) => (
                          <span
                            key={yr}
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-900"
                          >
                            <span>{yr}:</span>
                            <span className="font-bold text-indigo-700">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Matched Students Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Student</th>
                            <th className="py-2 px-3">Branch & Year</th>
                            <th className="py-2 px-3">Div</th>
                            <th className="py-2 px-3">CGPA</th>
                            <th className="py-2 px-3">Attendance</th>
                            <th className="py-2 px-3">Backlogs</th>
                            <th className="py-2 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPreviewStudents?.map((st) => (
                            <tr key={st.studentId} className="hover:bg-slate-50 transition-colors">
                              <td className="py-1.5 px-3">
                                <span className="font-bold text-slate-900 block">{st.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{st.studentId}</span>
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="text-slate-800 block line-clamp-1">{st.branch}</span>
                                <span className="text-[10px] text-slate-500">Year {st.year} (Sem {st.semester})</span>
                              </td>
                              <td className="py-1.5 px-3 font-semibold text-slate-700">
                                {st.division}
                              </td>
                              <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                                {st.cgpa.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-3">
                                <span className={`font-semibold ${st.attendanceRate >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {st.attendanceRate}%
                                </span>
                              </td>
                              <td className="py-1.5 px-3">
                                <span className={`text-[11px] font-semibold ${st.activeBacklogs && st.activeBacklogs > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                                  {st.activeBacklogs ?? 0}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <Check className="h-3 w-3" />
                                  Eligible
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filteredPreviewStudents?.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-slate-500 text-xs">
                                No matching students found in preview.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WHAT STUDENTS WILL LEARN & REQUIREMENTS */}
          {activeTab === 'learning' && (
            <div className="space-y-5">
              {/* What Students Will Learn */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>What You'll Experience (Enter 1 point per line)</span>
                  <span className="text-[11px] text-slate-400">Bulleted takeaways</span>
                </label>
                <textarea
                  rows={4}
                  value={whatStudentsWillLearn}
                  onChange={(e) => setWhatStudentsWillLearn(e.target.value)}
                  placeholder="Industrial robotics workflow and SCADA integration&#10;High-voltage power sub-station switchgear mechanisms&#10;Enterprise quality control and automated testing"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Why Worth Attending */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">Why Worth Attending (Enter 1 point per line)</label>
                <textarea
                  rows={3}
                  value={whyWorthAttendingText}
                  onChange={(e) => setWhyWorthAttendingText(e.target.value)}
                  placeholder="Direct interaction with senior engineering leadership&#10;Official Institutional Industrial Visit Certification&#10;Hands-on demonstration of cutting-edge technology"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Mandatory Prerequisites & Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Mandatory Prerequisites / Dress Code</label>
                  <textarea
                    rows={3}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Carry physical College ID card&#10;Formal attire / institutional uniform&#10;Closed toe footwear required"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Plant Rules & Safety Directives</label>
                  <textarea
                    rows={3}
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="Strict safety shoes mandatory on shop floor&#10;No photography in server and assembly halls&#10;Follow faculty coordinator instructions"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: IMAGE, CAPACITY & STATUS */}
          {activeTab === 'logistics' && (
            <div className="space-y-5">
              {/* Preset Image Gallery */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Select Preset Cover Image</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setImage(img.url)}
                      className={`group relative rounded-lg border overflow-hidden text-left transition-all cursor-pointer ${
                        image === img.url
                          ? 'border-indigo-600 ring-2 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="h-20 w-full overflow-hidden bg-slate-100">
                        <img
                          src={img.url}
                          alt={img.label}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-1.5 bg-white">
                        <span className="text-[10px] font-semibold text-slate-800 line-clamp-1 block">
                          {img.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">Or Custom Cover Image URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/plant-banner.jpg"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
                  />
                  {image && (
                    <div className="h-9 w-14 rounded border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100">
                      <img src={image} alt="Preview" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Capacity & Contribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Maximum Participants (Seats) <span className="text-rose-500">*</span></span>
                    {validationErrors.capacity && (
                      <span className="text-[11px] text-rose-600 font-medium">{validationErrors.capacity}</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">Auto-enables dynamic waitlist overflow</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Student Contribution / Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={contribution}
                    onChange={(e) => setContribution(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">Enter 0 for fully university funded visits</span>
                </div>
              </div>

              {/* Publication Status Selector */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <label className="text-xs font-bold text-slate-900 block">Initial Publication Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      status === 'DRAFT'
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'DRAFT'}
                      onChange={() => setStatus('DRAFT')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Save as Draft</span>
                      <span className="text-[11px] text-slate-500">Only visible to you. Edit and preview before opening to students.</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      status === 'PUBLISHED' || status === 'PENDING_APPROVAL'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'PUBLISHED' || status === 'PENDING_APPROVAL'}
                      onChange={() => setStatus('PUBLISHED')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {role === 'FACULTY' ? 'Submit for HOD Approval' : 'Publish Immediately'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {role === 'FACULTY'
                          ? 'Routes to HOD approval queue before publishing.'
                          : 'Instantly visible in Student Portal for registrations.'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Step {activeTab === 'basic' ? '1' : activeTab === 'schedule' ? '2' : activeTab === 'eligibility' ? '3' : activeTab === 'learning' ? '4' : '5'} of 5
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {status === 'DRAFT' && (
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, 'DRAFT')}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : isEditing ? 'Save Draft Changes' : 'Save as Draft'}
              </button>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, 'PUBLISHED')}
              className="rounded-lg bg-[#0B2545] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>
                {submitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Experience'
                  : role === 'FACULTY'
                  ? 'Submit for HOD Approval'
                  : 'Publish Experience'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


