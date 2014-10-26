# Makefile for Jagged-Path
TARGET = JaggedPath

include make.objects

ifeq ($(OS), Windows_NT)
	$(error make on windows doesn't work for this yet :s)
else
	UNAME := $(shell uname -s)
	ifeq ($(shell uname -m), x86_64)
		ARCH = 64
	endif
	ifeq ($(UNAME), Linux)
		SYSTEM = Linux
	endif
	ifeq ($(UNAME), Darwin)
		SYSTEM = OSX
	endif
endif

DEFS := -DSCREEN_WIDTH=1024 -DSCREEN_HEIGHT=768 -DSCREENDEPTH=768

# general compiler settings
CPPFLAGS = $(DEFS)
CXXFLAGS = -std=c++0x -ggdb -Wall

#default TARGET is Linux
all: linux

# TARGET specific settings
linux: LDFLAGS = 

linux: $(MAIN)
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) $(MAIN) -o $(TARGET) $(LDFLAGS)

%.o : %.cpp
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) -c $< -o $@

clean:
	$(warning Cleaning...)
	@$(RM) $(MAIN)

clean_bin:
	$(warning Cleaning...)
	@$(RM) $(TARGET) $(MAIN)

.PHONY: all clean
