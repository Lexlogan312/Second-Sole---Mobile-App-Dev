import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Trash2, Shield, Plus, Activity, AlertCircle, X, Check, Calendar } from 'lucide-react';
import { Card, Button, SectionHeader, Input, Badge } from '../components/UI';
import { storageService } from '../services/storage';
import { ShoeRotationItem } from '../types';
import { INVENTORY } from '../constants';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState(storageService.getProfile());
  const [rotation, setRotation] = useState(storageService.getRotation());
  const [privacyAudit] = useState(storageService.getPrivacyAudit());
  
  // Log Miles State
  const [showLogModal, setShowLogModal] = useState<string | null>(null);
  const [logMilesInput, setLogMilesInput] = useState('');
  const [logTerrain, setLogTerrain] = useState<'Road' | 'Trail'>('Road');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Add Shoe State
  const [addingShoe, setAddingShoe] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [customName, setCustomName] = useState('');

  if (profile.isGuest) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <Shield size={48} className="text-[#A0AEC0] mb-4" />
              <h2 className="text-xl font-bold mb-2">Guest Mode</h2>
              <p className="text-[#A0AEC0] mb-6">Create a secure local profile to unlock the Sole Tracker, multi-shoe rotation, and discount rewards.</p>
              <Button onClick={() => storageService.wipeData()}>Create Profile</Button>
          </div>
      );
  }

  const handleLogMiles = () => {
      if (showLogModal && logMilesInput) {
          const miles = parseFloat(logMilesInput);
          if (isNaN(miles) || miles <= 0) return;
          
          storageService.updateRotationShoe(showLogModal, miles);
          storageService.updateProfile({ milesRun: (profile.milesRun || 0) + miles });
          
          setRotation(storageService.getRotation());
          setProfile(storageService.getProfile());
          setShowLogModal(null);
          setLogMilesInput('');
          setLogTerrain('Road');
      }
  };

  const handleAddShoe = () => {
      let shoeName = customName;
      let shoeImg = undefined;
      let shoeIdRef = 'custom';

      if (selectedInventoryId) {
          const invShoe = INVENTORY.find(s => s.id === selectedInventoryId);
          if (invShoe) {
              shoeName = invShoe.name;
              shoeImg = invShoe.image;
              shoeIdRef = invShoe.id;
          }
      }

      if (shoeName) {
          const newShoe: ShoeRotationItem = {
              id: Date.now().toString(),
              shoeId: shoeIdRef,
              name: shoeName,
              miles: 0,
              threshold: 350,
              image: shoeImg
          };
          storageService.addToRotation(newShoe);
          setRotation(storageService.getRotation());
          setAddingShoe(false);
          setCustomName('');
          setSelectedInventoryId('');
      }
  };

  const handleDeleteShoe = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevents click from bubbling to the Card or container
      if(confirm('Retire this shoe?')) {
          storageService.removeRotationShoe(id);
          // Force update state from storage
          setRotation(storageService.getRotation());
      }
  };

  const AddShoeModal = (
      <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAddingShoe(false)} />
          <div className="bg-[#111111] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 p-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-white">Add to Rotation</h3>
                  <button onClick={() => setAddingShoe(false)}><X size={20} className="text-[#A0AEC0]" /></button>
              </div>

              <div className="space-y-4 mb-6">
                  <div>
                      <label className="text-xs text-[#A0AEC0] uppercase font-bold mb-2 block">Select from Inventory</label>
                      <select 
                          className="w-full bg-black border border-white/10 rounded-xl h-12 px-4 text-white focus:outline-none focus:border-[#e43928] appearance-none"
                          value={selectedInventoryId}
                          onChange={(e) => {
                              setSelectedInventoryId(e.target.value);
                              setCustomName('');
                          }}
                      >
                          <option value="">Select a model...</option>
                          {INVENTORY.map(s => (
                              <option key={s.id} value={s.id}>{s.brand} {s.name}</option>
                          ))}
                      </select>
                  </div>
                  
                  <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-[#111111] px-2 text-[#A0AEC0]">Or Custom Entry</span>
                      </div>
                  </div>

                  <Input 
                      placeholder="Custom Shoe Name" 
                      value={customName}
                      onChange={(e) => {
                          setCustomName(e.target.value);
                          setSelectedInventoryId('');
                      }}
                      disabled={!!selectedInventoryId}
                  />
              </div>

              <Button fullWidth onClick={handleAddShoe} disabled={!selectedInventoryId && !customName}>Add Shoe</Button>
          </div>
      </div>
  );

  const LogMilesModal = (
      <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLogModal(null)} />
          <div className="bg-[#111111] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 border border-white/10 p-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-white">Log Activity</h3>
                  <button onClick={() => setShowLogModal(null)}><X size={20} className="text-[#A0AEC0]" /></button>
              </div>

              <div className="space-y-6">
                  <div className="flex items-center justify-center py-4 bg-black/30 rounded-2xl">
                      <input 
                          type="number" 
                          value={logMilesInput}
                          onChange={(e) => setLogMilesInput(e.target.value)}
                          placeholder="0.0"
                          className="bg-transparent text-5xl font-bold text-center w-full focus:outline-none text-[#A3EBB1] placeholder:text-white/10"
                          autoFocus
                      />
                  </div>
                  <p className="text-center text-[#A0AEC0] -mt-4 text-sm font-medium">Miles</p>

                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={() => setLogTerrain('Road')}
                          className={`h-12 rounded-xl font-medium transition-colors ${logTerrain === 'Road' ? 'bg-white text-black' : 'bg-black border border-white/10 text-[#A0AEC0]'}`}
                      >
                          Road
                      </button>
                      <button 
                          onClick={() => setLogTerrain('Trail')}
                          className={`h-12 rounded-xl font-medium transition-colors ${logTerrain === 'Trail' ? 'bg-[#A3EBB1] text-black' : 'bg-black border border-white/10 text-[#A0AEC0]'}`}
                      >
                          Trail
                      </button>
                  </div>

                  <div className="bg-black rounded-xl p-4 flex items-center gap-3 border border-white/10">
                      <Calendar size={18} className="text-[#A0AEC0]" />
                      <input 
                          type="date" 
                          value={logDate}
                          onChange={(e) => setLogDate(e.target.value)}
                          className="bg-transparent text-white w-full focus:outline-none text-sm font-medium"
                      />
                  </div>

                  <Button fullWidth onClick={handleLogMiles} disabled={!logMilesInput}>Save Run</Button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 pb-8">
      <div className="text-center py-6">
        <div className="w-24 h-24 bg-gradient-to-br from-[#ffffff] to-[#e43928] rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(228,57,40,0.3)]">
            <span className="text-3xl font-bold text-black">{profile.name.charAt(0)}</span>
        </div>
        <h2 className="text-2xl font-bold">{profile.name}</h2>
        <div className="flex justify-center gap-2 mt-2">
             <Badge color="bg-[#111111] border border-white/10">{profile.attendanceCount} Runs Attended</Badge>
        </div>
      </div>

      {/* Rotation / Sole Tracker */}
      <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Sole Tracker</h2>
            <button onClick={() => setAddingShoe(true)} className="text-[#e43928] text-sm font-medium flex items-center">
                <Plus size={16} className="mr-1" /> Add Shoe
            </button>
        </div>

        <div className="space-y-4">
            {rotation.length === 0 && (
                <div className="text-center p-6 border border-dashed border-white/10 rounded-2xl text-[#A0AEC0]">
                    <p className="mb-2">No active shoes.</p>
                    <p className="text-xs">Add a shoe to track mileage and wear.</p>
                </div>
            )}
            {rotation.map(shoe => {
                const progress = Math.min((shoe.miles / shoe.threshold) * 100, 100);
                const statusColor = progress > 90 ? '#ef4444' : progress > 70 ? '#f59e0b' : '#e43928';
                
                return (
                    <Card key={shoe.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-4">
                                {shoe.image && (
                                    <img src={shoe.image} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-contain p-1 bg-black" />
                                )}
                                <div>
                                    <h3 className="font-bold text-lg">{shoe.name}</h3>
                                    <div className="text-xs text-[#A0AEC0]">{shoe.nickname || 'Rotation'}</div>
                                </div>
                            </div>
                            {/* FIX: Passed 'e' to handler to stop propagation */}
                            <button onClick={(e) => handleDeleteShoe(e, shoe.id)} className="text-[#A0AEC0] hover:text-red-400 p-2 -mr-2">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="mb-3 mt-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-mono text-white">{shoe.miles} mi</span>
                                <span className="text-[#A0AEC0]">{shoe.threshold} mi limit</span>
                            </div>
                            <div className="h-2 bg-[#000] rounded-full overflow-hidden">
                                <div 
                                    className="h-full transition-all duration-500" 
                                    style={{ width: `${progress}%`, backgroundColor: statusColor }}
                                />
                            </div>
                        </div>

                        <Button 
                            variant="secondary" 
                            size="sm" 
                            fullWidth 
                            onClick={() => setShowLogModal(shoe.id)}
                        >
                            <Activity size={14} className="mr-2" /> Log Activity
                        </Button>
                        
                        {progress >= 100 && (
                            <div className="mt-3 bg-[#e43928]/10 p-2 rounded text-xs text-[#e43928] flex items-center gap-2">
                                <AlertCircle size={14} /> Discount Unlocked! Show in store.
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
      </div>

      {/* Data Audit */}
      <div>
        <SectionHeader title="Data Audit" />
        <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-[#111111]">
                <div className="flex items-center gap-2 text-sm font-bold">
                    <Shield size={16} className="text-[#e43928]" />
                    Local Privacy Vault
                </div>
                <p className="text-xs text-[#A0AEC0] mt-1">Data stays on this device. No cloud sync.</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-[#A0AEC0]">Storage Used</span>
                    <span className="font-mono">{privacyAudit.storageUsed}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[#A0AEC0]">Profile Type</span>
                    <span>Local / Offline</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-[#A0AEC0]">Data Points</span>
                    <span>{rotation.length} shoes, {profile.attendanceCount} events</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-white/5">
                    <Button fullWidth variant="danger" size="sm" onClick={() => {
                        if(confirm("Permanently delete local profile and reset app?")) {
                            storageService.wipeData();
                        }
                    }}>
                        <Trash2 size={14} className="mr-2" /> Delete All Data
                    </Button>
                </div>
            </div>
        </Card>
      </div>

      {addingShoe && createPortal(AddShoeModal, document.body)}
      {showLogModal && createPortal(LogMilesModal, document.body)}
    </div>
  );
};