# frozen_string_literal: true

describe 'popup', type: :feature do
  describe 'for lot 25' do
    before :each do
      visit_relative '#?latitude=42.39196&longitude=-72.53437&zoom=19.0'
      find('#viewDiv').click
    end

    it 'opens and closes' do
      expect(page).to have_content('Lot 25 (Green)')
      click_by_title 'Close feature information'
      expect(page).to have_no_content('Lot 25 (Green)')
    end

    it 'docks and undocks' do
      # Should start docked
      expect(page).to have_selector('.custom-popup-container.docked')
      click_by_title 'Un-dock feature information'
      expect(page).to have_selector('.custom-popup-container')
      expect(page).to have_no_selector('.custom-popup-container.docked')
      click_by_title 'Dock feature information'
      expect(page).to have_selector('.custom-popup-container.docked')
    end
  end

  describe 'multiple features' do
    it 'loops around to first feature and back' do
      visit_relative '#?latitude=42.39193&longitude=-72.53521&zoom=17.0'

      find('#viewDiv').click
      expect(page).to have_content('Lot 12 (Yellow)')
      expect(page).to have_content('1/2')
      click_button 'Next'
      expect(page).to have_content('Lot 25 (Green)')
      expect(page).to have_content('2/2')
      click_button 'Next'
      expect(page).to have_content('Lot 12 (Yellow)')
      expect(page).to have_content('1/2')
      click_button 'Previous'
      expect(page).to have_content('Lot 25 (Green)')
      expect(page).to have_content('2/2')
    end
  end
end
