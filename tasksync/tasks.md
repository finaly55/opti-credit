# Task
pour la barre de parametre je veux quelque chose de plus comme ca : <div className="xl:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Settings className="h-4 w-4" /> Paramètres
                </h2>
              </div>
              
              <div className="divide-y divide-slate-100">
                {/* 1. ACQUISITION */}
                <AccordionItem title="Projet & Frais" isOpen={openSections.purchase} toggle={() => toggleSection('purchase')} icon={Home}>
                  <InputGroup label="Prix du bien" value={propertyPrice} onChange={setPropertyPrice} suffix="€" />
                  <InputGroup label="Frais d'agence" value={agencyFees} onChange={setAgencyFees} suffix="€" />
                  <InputGroup label="Frais de notaire" value={notaryFees} onChange={setNotaryFees} suffix="€" help="~7-8% dans l'ancien" />
                  <InputGroup label="Travaux initiaux" value={renovationCost} onChange={setRenovationCost} suffix="€" />
                  <InputGroup label="Valorisation du bien" value={propertyInflation} onChange={setPropertyInflation} suffix="%" step="0.1" help="% par an" />
                </AccordionItem>

                {/* 2. FINANCEMENT */}
                <AccordionItem title="Financement" isOpen={openSections.loan} toggle={() => toggleSection('loan')} icon={Wallet}>
                  <InputGroup label="Apport personnel" value={contribution} onChange={setContribution} suffix="€" />
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Durée" value={duration} onChange={setDuration} suffix="ans" />
                    <InputGroup label="Taux Crédit" value={interestRate} onChange={setInterestRate} suffix="%" step="0.05" />
                  </div>
                  <InputGroup label="Taux Assurance" value={insuranceRate} onChange={setInsuranceRate} suffix="%" step="0.01" />
                  <InputGroup label="Frais Dossier/Garantie" value={loanFees} onChange={setLoanFees} suffix="€" />
                  
                  <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-100 text-xs space-y-1">
                    <div className="flex justify-between text-blue-800">
                      <span>Emprunté:</span>
                      <span className="font-bold">{loanAmount.toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between text-blue-800">
                      <span>Mensualité:</span>
                      <span className="font-bold">{Math.round(monthlyLoanTotal).toLocaleString()} €</span>
                    </div>
                  </div>
                </AccordionItem>

                {/* 3. CHARGES COURANTES */}
                <AccordionItem title="Charges & Taxes" isOpen={openSections.costs} toggle={() => toggleSection('costs')} icon={FileText}>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Taxe Foncière" value={propertyTax} onChange={setPropertyTax} suffix="€" />
                    <InputGroup label="+ Augment." value={propertyTaxInflation} onChange={setPropertyTaxInflation} suffix="%" step="0.1" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Entretien / an" value={maintenanceCost} onChange={setMaintenanceCost} suffix="€" />
                    <InputGroup label="+ Augment." value={maintenanceInflation} onChange={setMaintenanceInflation} suffix="%" step="0.1" />
                  </div>
                </AccordionItem>

                {/* 4. SCENARIO LOCATAIRE */}
                <AccordionItem title="Locataire (Comparatif)" isOpen={openSections.rent} toggle={() => toggleSection('rent')} icon={Building2}>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Loyer" value={rentPrice} onChange={setRentPrice} suffix="€" />
                    <InputGroup label="+ Augment." value={rentInflation} onChange={setRentInflation} suffix="%" step="0.1" />
                  </div>
                  <InputGroup label="Rendement Épargne" value={savingsReturn} onChange={setSavingsReturn} suffix="%" step="0.1" help="Pour placement apport + delta" />
                </AccordionItem>
              </div>
            </div>
          </div>

          garde les slider, input mais simplifie l'affichage (moins de padding, plus compact)