import torch
import torch.nn as nn
from torchvision import models

class PsoriasisClassifier(nn.Module):
    """
    Dermatological screening transfer learning model using ResNet-18 or ResNet-50.
    Pretrained weights are used to initialize visual feature representation.
    """
    def __init__(self, num_classes=5, pretrained=True):
        super(PsoriasisClassifier, self).__init__()
        # Load a pretrained ResNet-18 model
        if pretrained:
            weights = models.ResNet18_Weights.DEFAULT
            self.backbone = models.resnet18(weights=weights)
        else:
            self.backbone = models.resnet18()
            
        # Replace the final fully connected layer with a custom classifier head
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Linear(num_features, 256),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)
