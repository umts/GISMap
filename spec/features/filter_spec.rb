# frozen_string_literal: true

describe 'filter', type: :feature do
  describe 'with no description' do
    before :each do
      expect(page).to have_no_selector('#filter-window')
      fill_in 'main', with: 'Red lot'
      sleep 3
      first('.custom-search-suggestion').click
      expect(page).to have_selector('#filter-window')
    end

    it 'filters by lot' do
      expect(page).to have_content('Red Lots')
    end

    it 'closes' do
      first('.custom-filter-close').click
      expect(page).to have_no_selector('#filter-window')
    end
  end

  describe 'with a description' do
    it 'expands to show description' do
      visitor_description = 'Pay at a meter or a paystation'

      fill_in 'main', with: 'Metered visitor parking'
      sleep 3

      first('.custom-search-suggestion').click
      expect(page).to have_no_content(visitor_description)
      first('.expandable-filter').click
      expect(page).to have_content(visitor_description)
    end
  end
end
