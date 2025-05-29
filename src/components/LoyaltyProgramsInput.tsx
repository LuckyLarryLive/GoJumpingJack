import React, { useState, useEffect } from 'react';
import AirlineSearchInput from './AirlineSearchInput';

interface LoyaltyProgram {
  airlineIataCode: string;
  programName: string;
  accountNumber: string;
}

interface LoyaltyProgramsInputProps {
  value: LoyaltyProgram[];
  onChange: (programs: LoyaltyProgram[]) => void;
}

const LoyaltyProgramsInput: React.FC<LoyaltyProgramsInputProps> = ({ value, onChange }) => {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>(value);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newProgram, setNewProgram] = useState<LoyaltyProgram>({
    airlineIataCode: '',
    programName: '',
    accountNumber: '',
  });

  useEffect(() => {
    setPrograms(value);
  }, [value]);

  const handleAddProgram = () => {
    if (!newProgram.airlineIataCode || !newProgram.programName || !newProgram.accountNumber) {
      return;
    }

    const updatedPrograms = [...programs, newProgram];
    setPrograms(updatedPrograms);
    onChange(updatedPrograms);
    setNewProgram({
      airlineIataCode: '',
      programName: '',
      accountNumber: '',
    });
  };

  const handleEditProgram = (index: number) => {
    setEditingIndex(index);
    setNewProgram(programs[index]);
  };

  const handleUpdateProgram = () => {
    if (editingIndex === null) return;

    const updatedPrograms = [...programs];
    updatedPrograms[editingIndex] = newProgram;
    setPrograms(updatedPrograms);
    onChange(updatedPrograms);
    setEditingIndex(null);
    setNewProgram({
      airlineIataCode: '',
      programName: '',
      accountNumber: '',
    });
  };

  const handleDeleteProgram = (index: number) => {
    const updatedPrograms = programs.filter((_, i) => i !== index);
    setPrograms(updatedPrograms);
    onChange(updatedPrograms);
  };

  const handleAirlineSelect = (iataCode: string | null, displayValue: string | null) => {
    if (!iataCode) return;
    setNewProgram(prev => ({ ...prev, airlineIataCode: iataCode }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {editingIndex !== null ? 'Edit Loyalty Program' : 'Add New Loyalty Program'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Airline
            </label>
            <AirlineSearchInput
              id="loyalty-airline-search"
              label="Search airlines"
              placeholder="Search for an airline"
              onAirlineSelect={handleAirlineSelect}
              currentValue={newProgram.airlineIataCode}
            />
          </div>

          <div>
            <label htmlFor="programName" className="block text-sm font-medium text-gray-700">
              Program Name
            </label>
            <input
              type="text"
              id="programName"
              value={newProgram.programName}
              onChange={(e) => setNewProgram(prev => ({ ...prev, programName: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Miles & More, SkyMiles"
            />
          </div>

          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
              Account Number
            </label>
            <input
              type="text"
              id="accountNumber"
              value={newProgram.accountNumber}
              onChange={(e) => setNewProgram(prev => ({ ...prev, accountNumber: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your loyalty program account number"
            />
          </div>

          <div className="flex justify-end">
            {editingIndex !== null ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    setNewProgram({
                      airlineIataCode: '',
                      programName: '',
                      accountNumber: '',
                    });
                  }}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateProgram}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update Program
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAddProgram}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Program
              </button>
            )}
          </div>
        </div>
      </div>

      {programs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Loyalty Programs</h3>
          <div className="space-y-4">
            {programs.map((program, index) => (
              <div
                key={`${program.airlineIataCode}-${program.accountNumber}`}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{program.programName}</h4>
                    <p className="text-sm text-gray-500">Airline: {program.airlineIataCode}</p>
                    <p className="text-sm text-gray-500">Account: {program.accountNumber}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditProgram(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProgram(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyProgramsInput; 