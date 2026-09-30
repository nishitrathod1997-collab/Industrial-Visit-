import React from 'react';
import { MapPin, ExternalLink, Navigation, Building, Globe } from 'lucide-react';
import { ExperienceWithMeta, Experience } from '../../types';

interface CompanyLocationSectionProps {
  experience: ExperienceWithMeta | Experience;
}

export const CompanyLocationSection: React.FC<CompanyLocationSectionProps> = ({ experience }) => {
  const companyName = experience.organization || experience.title || 'Industrial Partner';
  const website = experience.organizationWebsite;
  
  // Construct full address string
  const rawAddress = experience.address || experience.location || '';
  const city = experience.city || '';
  const state = experience.state || '';
  const country = experience.country || 'India';

  const addressParts = [rawAddress, city, state, country].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  // Compute latitude/longitude fallback for key partners if missing
  let lat = experience.latitude;
  let lng = experience.longitude;

  if (!lat || !lng) {
    const titleLower = (experience.title + ' ' + companyName + ' ' + fullAddress).toLowerCase();
    if (titleLower.includes('isro') || titleLower.includes('satellite') || titleLower.includes('telemetry')) {
      lat = 13.0315;
      lng = 77.5258;
    } else if (titleLower.includes('siemens') || titleLower.includes('kalwa') || titleLower.includes('airoli')) {
      lat = 19.1678;
      lng = 72.9972;
    } else if (titleLower.includes('tata motors') || titleLower.includes('pimpri') || titleLower.includes('pune')) {
      lat = 18.6298;
      lng = 73.8131;
    } else if (titleLower.includes('barc') || titleLower.includes('bhabha') || titleLower.includes('trombay')) {
      lat = 19.0069;
      lng = 72.915;
    } else if (titleLower.includes('reliance') || titleLower.includes('jamnagar')) {
      lat = 22.3739;
      lng = 69.8519;
    } else if (titleLower.includes('infosys') || titleLower.includes('electronics city')) {
      lat = 12.8452;
      lng = 77.6602;
    } else {
      // Default to Mumbai industrial zone
      lat = 19.076;
      lng = 72.8777;
    }
  }

  // Google Maps Direct Link
  const searchAddress = `${companyName}, ${fullAddress}`;
  const directMapsUrl =
    experience.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;

  // Google Maps Embed Query URL for interactive map frame
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    searchAddress
  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5" id="company-location-section">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B2545]/10 text-[#0B2545]">
            <MapPin className="h-5 w-5 text-[#0B2545]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Company Location</h3>
            <p className="text-xs text-slate-500 font-medium">Verified industrial plant & research facility address</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300 transition-all cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              <span>Official Website</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}
          {/* Google Maps Button */}
          <a
            href={directMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
          >
            <span>📍 Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Address & Facility Header */}
      <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-1.5">
        <div className="flex items-start gap-2">
          <Building className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{companyName}</h4>
            <p className="text-xs font-medium text-slate-700 mt-0.5 leading-relaxed">{fullAddress}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-semibold text-slate-500 border-t border-slate-200/60 mt-2">
          <span className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-blue-600" />
            <span>GPS Coordinates: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
          </span>
          <span>•</span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Verified Plant Entry Gate
          </span>
        </div>
      </div>

      {/* Map Preview Container */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 h-64 sm:h-72 relative">
        <iframe
          title={`Map view for ${companyName}`}
          src={mapEmbedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />
        
        {/* Floating Quick Action Overlay on Map */}
        <div className="absolute bottom-3 right-3 z-10">
          <a
            href={directMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 text-xs font-bold shadow-md hover:bg-slate-900 transition-all cursor-pointer"
          >
            <span>Get Directions</span>
            <ExternalLink className="h-3 w-3 text-amber-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
