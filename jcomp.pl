#!/usr/bin/perl

# writing this in perl for now, but may port to ruby as I'm interested to learn
# decided ruby sucks

# script functionality:
# concatenate js files together -- done
# remove comments -- done
# remove whitespace -- done
# add license at start -- done
# ignore json -- could include this
# rule file -- wip
# parse html and edit scripts -- todo

use warnings;
use strict;

# config class?
package Config;

my $comment = '#'; # what denotes a comment in the configuration file

sub new
{
  my $class = shift;
  my $file = shift;

  my $self = {};

  bless($self, $class);

  $self->{file} = $file;
  return $self;
}

sub File
{
  my $self = shift;
  return $self->{file};
}

sub Read
{
  my $self = shift;
  open(my $fh, '<', $self->{file}) or die "Can't open $self->{file} for reading: $!\n";
  while (<$fh>)
  {
    chomp(); # remove tailing whitespace
    my $parseTo = index($_, $comment);

    my $line = $_;
    $line = substr($_, 0, $parseTo) if ($parseTo >= 0); # chop of comments
    my @tokens = split(/[:,] /, $line);

    my $param =  shift(@tokens);
    $self->{config}->{$param} = join(' ', @tokens); # store the values as a space deliminated list 
  }
  close($fh);
}

sub GetParam
{
  my $self = shift;
  my $param = shift;

  if (defined $param)
  {
    return $self->{config}->{$param}
  }
  return undef;
}

## end of Config

package Source;

sub new
{
  my $class = shift;
  my $file = shift;

  my $self = {};

  bless($self, $class);

  $self->{file} = $file;
  $self->{text} = undef;
  $self->{line} = undef;
  return $self;
}

sub Read
{
  my $self = shift;

  open(my $fh, '<', $self->{file}) or die "Couldn't open $self->{file} for reading: $!\n";
  my @lines = <$fh>;
  close($fh);
  $self->{text} = \@lines;
}

sub Write
{
  my $self = shift;
  my $dest = shift;

  if (defined $self->{line})
  {
    $$dest .= $self->{line};
  }
  else # should only happen for the copyright file
  {
    foreach my $line (@{$self->{text}})
    {
      $$dest .= $line;
    }
  }
}

sub ScrubSingleLineComments
{
  my $self = shift;
#  print "ScrubSingleLineComments\n";
  my @lines = @{$self->{text}};
  for (my $i = 0; $i <= $#lines; $i++)
  {
    my $comment = index($lines[$i], '//');
    if ($comment >= 0)
    {
      $lines[$i] = substr($lines[$i], 0, $comment);
    }
  }
  $self->{text} = \@lines;
}

sub ScrubLeadTrailWhitespace
{
  my $self = shift;
#  print "ScrubLeadTrailWhitespace\n";
  my @lines = @{$self->{text}};
  for (my $i = 0; $i <= $#lines; $i++)
  {
    $lines[$i] =~ s/^[\t ]+//; # leading
    $lines[$i] =~ s/[\t ]+$//; # trailing
  }
  $self->{text} = \@lines;
}

sub ScrubNewLines
{
  my $self = shift;
#  print "ScrubNewLines\n";
  my @lines = @{$self->{text}};
  for (my $i = 0; $i <= $#lines; $i++)
  {
    $lines[$i] =~ s/[\r\n]//g; # replace any literal new lines
    $self->{line} .= $lines[$i]; # append to new var
  }
}

sub ScrubMultiLineComments
{
  my $self = shift;
  print "ScrubMultiLineComments\n";
  my $open = index($self->{line}, '/*');
  while ($open >= 0)
  {
    my $close = index($self->{line}, '*/');
    if ($close == -1) # there is no end, strip the rest of the file
    {
      $close = length($self->{line});
    }
    my $start = substr($self->{line}, 0, $open);
    my $end   = substr($self->{line}, $close + 2, length($self->{line}) - $close);
    $self->{line} = $start . $end;
    $open = index($self->{line}, '/*');
  }
}

sub HTMLReplaceSources
{
  my $self = shift;
  print "HTMLReplaceSources\n";
  my @sources = @{shift()};

  my @lines = @{$self->{text}};
  
}

## end of Source

# main
package main;

my $configFile = '';

# get our args
foreach my $ARG (@ARGV)
{
  $configFile = substr($ARG, 3) if (index($ARG, '-c=') != -1);
  help() if ($ARG eq '-h');
}

my $config = Config->new($configFile); # create config file object
$config->Read(); # read in data

# parse the js stuff
my $fileList = $config->GetParam('source-js');
my @files = split(' ', $fileList);
print "JS source files: @files\n";
my $content = "";
for (my $i = 0; $i <= $#files; $i++)
{
  my $source = Source->new($files[$i]); # repopulate file list with Source objects
  $source->Read();
  $source->ScrubSingleLineComments();
  $source->ScrubLeadTrailWhitespace();
  $source->ScrubNewLines();
  $source->ScrubMultiLineComments();
  $source->Write(\$content);
}

my $precontent = "";
my $postcontent = "";

# handle copyright
my $copyrightFile = $config->GetParam('copyright-file');
if (defined $copyrightFile)
{
  my $copyright = Source->new($copyrightFile);
  $copyright->Read();
  $precontent .= "/*\n";
  $copyright->Write(\$precontent);
  $precontent .= "\n" if (substr($precontent, -1) ne "\n");
  $precontent .= "*/\n\n";
}

# write the data out
my $target = $config->GetParam('target-js');
open(my $fh, '>', $target) or die "Couldn't open $target for writing: $!\n";
print $fh $precontent;
print $fh $content;
print $fh $postcontent;
close($fh);


# now handle html
my $htmlList = $config->GetParam('source-html');
my @htmlFiles = split(' ', $htmlList);
print "HTML source files: @htmlFiles\n";
for (my $i = 0; $i <= $#htmlFiles; $i++)
{
  my $html = Source->new($files[$i]);
  $html->Read();
  $html->HTMLReplaceSources(\@files);
}
exit(0);

sub help
{
  print <<EOH;
$0 - JavaScript deployment script for Jagged Path

Options:
--help
    Displays this text.

--conf=file
    Configuration file to do the deployment for

EOH
  exit(0);
}