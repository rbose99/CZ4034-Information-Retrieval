from tkinter import *
import os
import threading
import sys
from PyQt5.QtCore import Qt
from PyQt5.QtCore import QProcess
from PyQt5.QtWidgets import QApplication
from PyQt5.QtWidgets import QLabel
from PyQt5.QtWidgets import QWidget
from PyQt5.QtWidgets import QVBoxLayout
from PyQt5.QtWidgets import QHBoxLayout
from PyQt5.QtWidgets import QPushButton
from PyQt5.QtWidgets import QRadioButton
from PyQt5.QtWidgets import QMainWindow


class SEngineUi(QMainWindow):

    def __init__(self):
        """View initializer."""
        super().__init__()
        # Set some main window's properties
        self.setWindowTitle('GUI for Search Engine')
        self.setFixedSize(235, 235)
        self.generalLayout = QVBoxLayout()
        # Set the central widget
        self._centralWidget = QWidget(self)
        self.setCentralWidget(self._centralWidget)
        self._centralWidget.setLayout(self.generalLayout)
        self._createDisplay()
        self._createButtons()

    def _createDisplay(self):
        self.display=QLabel('Please ensure SOLR is running before injecting.')
        self.display.setFixedHeight(35)
        self.generalLayout.addWidget(self.display)

    def _createButtons(self):
        sourcelabel= QLabel('Source:')
        buttonsLayout = QVBoxLayout()
        radioButtonsLayout = QHBoxLayout()
        self.rbtn1 = QRadioButton('Tweets')
        self.rbtn2 = QRadioButton('Reddit Posts')
        self.rbtn3 = QRadioButton('Reddit Comments')
        self.btngroup1 = QButtonGroup()
        self.btngroup1.addButton(self.rbtn1)
        self.btngroup1.addButton(self.rbtn2)
        self.btngroup1.addButton(self.rbtn3)
        radioButtonsLayout.addWidget(self.rbtn1)
        radioButtonsLayout.addWidget(self.rbtn2)
        radioButtonsLayout.addWidget(self.rbtn3)
        buttonsLayout.addLayout(radioButtonsLayout)
        button1=QPushButton('Crawl Data')
        button1.clicked.connect(self.scraping)
        buttonsLayout.addWidget(button1)
        button2=QPushButton('Inject Data')
        button2.clicked.connect(self.inject_data)
        buttonsLayout.addWidget(button2)
        self.generalLayout.addLayout(buttonsLayout)
    def scraping(self):
        if self.p1 is None and self.p2 is None:
            self.p1=QProcess()
            self.p1.start("python", ['GUI_Scrape.py'])
            self.p1.finished.connect(self.p1_finished)
        #execfile('server.py') #write any file with .py extension.This method is similar to rightclick and open
    def inject_data(self):
        if self.p1 is None and self.p2 is None:
            self.p2=QProcess()
            i
            self.p2.start("python", ['GUI_Inject.py'])
            self.p2.finished.connect(self.p2_finished)
    def p1_finished(self):
        self.message("Process finished.")
        self.p1 = None
    def p2_finished(self):
        self.message("Process finished.")
        self.p2 = None
    
def main():
    """Main function."""
    # Create an instance of QApplication
    app = QApplication(sys.argv)
    # Show the calculator's GUI
    view = SEngineUi()
    view.show()
    # Execute the calculator's main loop
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()

app = QApplication(sys.argv)
window = QWidget()
window.setWindowTitle('GUI for Search Engine')
window.setGeometry(100, 100, 280, 80)
helloMsg = QLabel('<h1>To use the GUI:</h1>', parent=window)
helloMsg.move(60, 15)



def check_status(p):
    if p.is_alive(): # Then the process is still running
        label_1.config(text = "Status: Busy, currently running script...")
        button_1.config(state = "disabled")
        button_2.config(state = "disabled")
        button_3.config(state = "disabled")
        button_4.config(state = "disabled")
        button_5.config(state = "disabled")
        root.after(200, lambda p=p: check_status(p)) # After 200 ms, it will check the status again.
    else:
        label_1.config(text = "Status: Available to run scripts.")
        button_1.config(state = "normal")
        button_2.config(state = "normal")
        button_3.config(state = "normal")
        button_4.config(state = "normal")
        button_5.config(state = "normal")
    return









def thread_twitter_scraping():
    p = threading.Thread(target=twitter_scraping)
    p.start()
    check_status(p)

def thread_inject_data():
     p =threading.Thread(target=inject_data)
     p.start()
     check_status(p)

def thread_run_solr():
    p =threading.Thread(target=run_solr)
    p.start()
    check_status(p)

def thread_run_server():
    p =threading.Thread(target=run_server)
    p.start()
    check_status(p)


def thread_run_client():
    p =threading.Thread(target=run_client)
    p.start()
    check_status(p)


button_1 = Button(root, text = "Scrape Data", command = thread_twitter_scraping)
button_2 = Button(root, text = "Inject Data to SOLR", command = thread_inject_data)
button_3 = Button(root, text = "Run SOLR Database", command = thread_run_solr)
button_4 = Button(root, text = "Run Server", command = thread_run_server)
button_5 = Button(root, text = "Run Client", command =thread_run_client)
label_1 = Label(master = root, text = "Status: Available to run scripts.")
label_2 = Label(master = root, anchor="e",justify=LEFT, text = 
"""
To startup whole application:
1. Run SOLR Database
(may take some time, ensure browser is open before proceeding)
2. Run Server
3. Run Listener
4. Run Client""")

label_2.pack()
button_1.pack()
button_2.pack()
button_3.pack()
button_4.pack()
button_5.pack()
label_1.pack()


