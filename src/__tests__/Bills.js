/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from '../containers/Bills'
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("The bill modal should be displayed when a bill is selected (by the eye icon)", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const billContent = new Bills({
        document, onNavigate, store:null, localStorage:localStorageMock
      })
      const html = BillsUI({
        data:bills
      })
      document.innerHTML = html
      $.fn.modal = jest.fn()
      const handleClickIconEye = jest.fn((e) => {
        billContent.handleClickIconEye(e.target)
      })
      document.querySelector(`div[data-testid="icon-eye"]`).addEventListener('click', handleClickIconEye)
      fireEvent.click(document.querySelector(`div[data-testid="icon-eye"]`))
      expect(screen.getAllByText('Justificatif')).toBeTruthy()
    })
    test("The new bill page should be displayed when user click on 'newBill' button", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const billContent = new Bills({
        document, onNavigate, store:null, localStorage:localStorageMock
      })
      const html = BillsUI({
        data:bills
      })
      document.innerHTML = html
      $.fn.modal = jest.fn()
      const handleClickNewBill = jest.fn(() => {
        billContent.handleClickNewBill()
      })
      screen.getByTestId('btn-new-bill').addEventListener('click', handleClickNewBill)
      fireEvent.click(screen.getByTestId('btn-new-bill'))
      const html2 = NewBillUI()
      document.body.innerHTML = html2
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })
  })
})

// Test d'intégration GET

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const billsRaws  = await screen.getByTestId("tbody")
      expect(billsRaws).toBeTruthy()
    })
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})