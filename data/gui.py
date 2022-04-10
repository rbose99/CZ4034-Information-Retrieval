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
from PyQt5.QtWidgets import QButtonGroup



def main():
    # Create an instance of QApplication
    app = QApplication(sys.argv)
    # Show the calculator's GUI
    view = SEngineUi()
    view.show()
    # Execute the calculator's main loop
    sys.exit(app.exec_())


class SEngineUi(QMainWindow):

    def __init__(self):
        """View initializer."""
        super().__init__()
        # Set some main window's properties
        self.setWindowTitle('GUI for Search Engine')
        self.setFixedSize(350, 150)
        self.generalLayout = QVBoxLayout()
        # Set the central widget
        self._centralWidget = QWidget(self)
        self.setCentralWidget(self._centralWidget)
        self._centralWidget.setLayout(self.generalLayout)
        self._createDisplay()
        self._createButtons()
        self.p1 = None
        self.p2 = None
       
        

    def _createDisplay(self):
        self.display=QLabel('Please ensure SOLR is running before injecting.')
        self.display.setFixedHeight(35)
        self.generalLayout.addWidget(self.display)

    def _createButtons(self):
        sourcelabel= QLabel('Source:')
        self.buttonsLayout = QVBoxLayout()
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
        self.buttonsLayout.addLayout(radioButtonsLayout)
        self.button1=QPushButton('Crawl Data')
        self.button1.clicked.connect(self.scraping)
        self.buttonsLayout.addWidget(self.button1)
        button2=QPushButton('Inject Data')
        button2.clicked.connect(self.inject_data)
        self.buttonsLayout.addWidget(button2)
        self.generalLayout.addLayout(self.buttonsLayout)
    def scraping(self):
        print("morchi")
        if self.p1 is None and self.p2 is None:
            self.p1=QProcess()
            print("going")
            source=self.getButton()
            self.p1.start("python", ['scrape_gui.py', '--source',source])
            self.p1.finished.connect(self.p1_finished)
        #execfile('server.py') #write any file with .py extension.This method is similar to rightclick and open
    def inject_data(self):
        if self.p1 is None and self.p2 is None:
            self.p2=QProcess()
            source=self.getButton()
            print("going")
            self.p2.start("python", ['inject_gui.py','--source',source])
            self.p2.finished.connect(self.p2_finished)
    def p1_finished(self):
        print("Process finished.")
        self.p1 = None
    def p2_finished(self):
        print("Process finished.")
        self.p2 = None
    def getButton(self):
        return self.btngroup1.checkedButton().text()

if __name__ == '__main__':
    main()